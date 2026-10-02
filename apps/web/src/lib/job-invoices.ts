import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from './db';
import { lockJob } from './job-workflow';
import { fullJobNumbers, canonicalHash, WorkflowError } from './job-workflow-rules';
import { invoiceMimeType,supplierDetailsSchema,supplierDuplicateKey } from './invoice-workflow';
import { saveSupplierCosts } from './supplier-cost-service';
import type { Prisma } from '@prisma/client';

const metadata=z.object({messageId:z.string().min(1).max(1000),fileName:z.string().min(1).max(255),evidence:z.array(z.string().max(100_000)).max(20),details:z.record(z.unknown()).default({})});
export async function stageInvoice(raw:unknown,bytes:Uint8Array) {
 const input=metadata.parse(raw);
 if(!bytes.length || bytes.length>4*1024*1024)throw new WorkflowError('Attachment must be between 1 byte and 4 MB.',400);
 const mime=invoiceMimeType(bytes);if(!mime)throw new WorkflowError('Unsupported original attachment type.',400);
 const hash=createHash('sha256').update(bytes).digest('hex');
 let numbers:string[]=[],attention:string|null=null;
 try{numbers=fullJobNumbers([...input.evidence,input.fileName]);}catch{attention='Invalid full job number in source evidence.';}
 if(numbers.length!==1)attention ||= 'Exactly one full TE job number is required; do not match by project name.';
 const parsed=supplierDetailsSchema.safeParse(input.details);
 if(!parsed.success)attention ||= 'Invoice fields are missing, inconsistent, or use an unsupported currency. Review the original; never infer currency.';
 const key=parsed.success?supplierDuplicateKey(parsed.data.supplier,parsed.data.invoiceNumber):null;
 const item=await db.$transaction(async tx=>{
  // Serialize both identical bytes and revised documents for the same vendor/invoice.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key || hash},0))`;
  const existing=await tx.inboundInvoice.findUnique({where:{sha256:hash}});
  if(existing){
   const conflicting=numbers.length!==1 || existing.jobNumber!==numbers[0] || canonicalHash(existing.details)!==canonicalHash(input.details);
   return tx.inboundInvoice.update({where:{id:existing.id},data:{sourceMessageIds:[...new Set([...existing.sourceMessageIds,input.messageId])],...(conflicting?{attention:'Repeated original carries conflicting job evidence. Review; existing costs were not changed.',state:existing.state==='IMPORTED'?'IMPORTED':'REVIEW'}:{})}});
  }
  const project=numbers.length===1?await tx.project.findUnique({where:{jobNumber:numbers[0]}}):null;
  if(!project)attention ||= 'Unknown or absent full job number; review required.';
  if(key && (await tx.inboundInvoice.count({where:{vendorKey:key}}) || await tx.supplierInvoice.count({where:{duplicateKey:key}})))attention ||= 'This vendor/invoice number already exists with different or manually uploaded bytes; reconcile before importing.';
  if(project && await tx.vendorBill.count({where:{projectId:project.id,supplierInvoiceId:null}}))attention ||= 'Manual costs exist on this job. Reconcile possible duplicates before import.';
  return tx.inboundInvoice.create({data:{sha256:hash,sourceMessageIds:[input.messageId],fileName:input.fileName,mimeType:mime,fileData:Buffer.from(bytes),jobNumber:numbers.length===1?numbers[0]:null,projectId:project?.id,vendorKey:key,details:input.details as Prisma.InputJsonValue,state:attention?'REVIEW':'WAITING_APPROVAL',attention}});
 });
 if(item.projectId && item.state!=='REVIEW' && item.state!=='IMPORTED')await queueInvoiceCopies(item.projectId);
 return db.inboundInvoice.findUniqueOrThrow({where:{id:item.id},select:{id:true,state:true,attention:true,jobNumber:true,sha256:true}});
}
export async function queueInvoiceCopies(projectId:string) {
 return db.$transaction(async tx=>{
  const p=await lockJob(tx,projectId);
  if(p.workflowState!=='READY'||p.approvedSowRevision!==p.sowRevision||!p.productionFolder){
   await tx.inboundInvoice.updateMany({where:{projectId,state:{in:['WAITING_APPROVAL','WAITING_FOLDER']}},data:{state:p.approvedSowRevision===p.sowRevision?'WAITING_FOLDER':'WAITING_APPROVAL'}});
   return;
  }
  const rows=await tx.inboundInvoice.findMany({where:{projectId,state:{in:['WAITING_APPROVAL','WAITING_FOLDER']}}});
  for(const row of rows){
   await tx.workflowTask.upsert({where:{id:`invoice:${row.id}`},create:{id:`invoice:${row.id}`,projectId,kind:'INVOICE_COPY',revision:p.sowRevision,payload:{invoiceId:row.id,projectId,jobNumber:p.jobNumber,folderName:p.folderName,sha256:row.sha256,fileName:row.fileName}},update:{}});
   await tx.inboundInvoice.update({where:{id:row.id},data:{state:'COPY_PENDING'}});
  }
 });
}
export async function finishInvoice(taskId:string,token:string,path:string,sha256:string,userId:string){
 return db.$transaction(async tx=>{
  const ref=await tx.workflowTask.findUniqueOrThrow({where:{id:taskId}});
  const payload=z.object({invoiceId:z.string()}).parse(ref.payload);
  const initial=await tx.inboundInvoice.findUniqueOrThrow({where:{id:payload.invoiceId}});
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${initial.vendorKey || initial.sha256},0))`;
  const p=await lockJob(tx,ref.projectId);
  // Another acknowledgment may have committed while this transaction waited for the lock.
  const row=await tx.inboundInvoice.findUniqueOrThrow({where:{id:payload.invoiceId}});
  const task=await tx.workflowTask.findUniqueOrThrow({where:{id:taskId}});
  if(task.kind!=='INVOICE_COPY'||task.leaseToken!==token)throw new WorkflowError('Invoice task lease mismatch.');
  if(task.state==='DONE'&&row.state==='IMPORTED')return {supplierInvoiceId:row.supplierInvoiceId};
  if(row.state!=='COPY_PENDING')throw new WorkflowError('Invoice requires review before importing.');
  if(task.state!=='RUNNING'||p.workflowState!=='READY'||p.approvedSowRevision!==p.sowRevision)throw new WorkflowError('Approval changed; reconcile before importing.');
  const expected=`${p.productionFolder}/Outside Costs/${row.fileName.replace(/[\/:\0]/g,'_')}`;
  if(path!==expected||sha256!==row.sha256)throw new WorkflowError('Original file acknowledgment does not match this invoice.');
  const conflicts=await tx.inboundInvoice.count({where:{vendorKey:row.vendorKey,id:{not:row.id}}});
  const duplicate=await tx.supplierInvoice.findFirst({where:{OR:[{sha256:row.sha256},...(row.vendorKey?[{duplicateKey:row.vendorKey}]:[])]}});
  const manual=await tx.vendorBill.count({where:{projectId:p.id,supplierInvoiceId:null}});
  if(conflicts||duplicate||manual){
   await tx.inboundInvoice.update({where:{id:row.id},data:{state:'REVIEW',localPath:path,attention:'An invoice or manual cost may already cover this expense; reconcile before import.'}});
   await tx.workflowTask.update({where:{id:taskId},data:{state:'REVIEW',attention:'Possible duplicate cost; original saved, ledger unchanged.'}});
   return {review:true};
  }
  const details=supplierDetailsSchema.parse(row.details);
  const doc=await tx.supplierInvoice.create({data:{projectId:p.id,fileName:row.fileName,mimeType:row.mimeType,fileData:row.fileData,sha256:row.sha256,details,uploadedById:userId}});
  await saveSupplierCosts(tx,p.id,doc.id,details,true);
  await tx.inboundInvoice.update({where:{id:row.id},data:{state:'IMPORTED',localPath:path,supplierInvoiceId:doc.id,attention:null}});
  await tx.workflowTask.update({where:{id:taskId},data:{state:'DONE',completedAt:new Date(),result:{path,supplierInvoiceId:doc.id},leaseUntil:null}});
  return {supplierInvoiceId:doc.id};
 });
}
