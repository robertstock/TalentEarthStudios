import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { configuredApproverIds, isActivePriceApprover } from './price-approval';
import { businessDay, canonicalHash, CLAIM_SUBMISSION_SQL, NEXT_SEQUENCE_SQL, jobNumber, productionFolderName, PRODUCTION_PARENT, WorkflowError } from './job-workflow-rules';

export const submissionInput = z.object({
  submissionId: z.string().uuid(), projectName: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(200), email: z.string().email(),
  company: z.string().max(200).optional(), sow: z.string().trim().min(1).max(100_000),
  timeline: z.string().max(2000).optional(), budgetRange: z.string().max(2000).optional(),
});
export async function submitFinleyJob(raw: unknown, request: unknown, mobileAccountId?: string) {
  const input = submissionInput.parse(raw);
  const timezone = process.env.JOB_BUSINESS_TIMEZONE || '';
  const recipient = z.string().email().safeParse(process.env.JOB_NOTIFICATION_EMAIL);
  if (!recipient.success) throw new WorkflowError('Confirm and configure the job notification recipient.', 503);
  const day = businessDay(new Date(), timezone);
  const hash = canonicalHash({ request, mobileAccountId: mobileAccountId || null });
  return db.$transaction(async tx => {
    const [claim] = await tx.$queryRawUnsafe<Array<{requestHash:string; projectId:string|null}>>(CLAIM_SUBMISSION_SQL, input.submissionId, hash, new Date());
    if (claim.requestHash !== hash) throw new WorkflowError('Submission changed. Review the saved job or start an explicit new submission.');
    if (claim.projectId) return tx.project.findUniqueOrThrow({where:{id:claim.projectId}});
    const owner = await tx.user.findFirst({where:{id:{in:configuredApproverIds()},role:'ADMIN',status:'APPROVED'},orderBy:{createdAt:'asc'}});
    if (!owner) throw new WorkflowError('Configure the verified, active owner account before accepting new jobs.',503);
    const [counter] = await tx.$queryRawUnsafe<Array<{sequence:number}>>(NEXT_SEQUENCE_SQL,day);
    const number = jobNumber(day,counter.sequence);
    const client = await tx.client.findFirst({where:{email:input.email},orderBy:{createdAt:'asc'}}) || await tx.client.create({data:{email:input.email,companyName:input.company || input.name,primaryContactName:input.name}});
    const project = await tx.project.create({data:{
      name:input.projectName, jobName:input.projectName, jobNumber:number, description:input.sow,
      clientId:client.id, clientNameOverride:input.company || input.name, createdById:owner.id,
      timeline:input.timeline, budgetRange:input.budgetRange, status:'SOW_DRAFT',
      workflowState:'AWAITING_APPROVAL', sowBody:input.sow,sowRevision:1,
      isAutoRouted:false,requiresRpmReview:true,retailMultiplier:2,pricingPolicy:'ALL_COSTS',
      sows:{create:{versionNumber:1,status:'DRAFT',bodyRichText:input.sow,createdById:owner.id,shareToken:randomUUID()}},
    }});
    await tx.jobSubmission.update({where:{id:input.submissionId},data:{projectId:project.id}});
    if (mobileAccountId) await tx.mobileSubmission.create({data:{id:input.submissionId,accountId:mobileAccountId,projectId:project.id}});
    await tx.workflowTask.create({data:{id:`confirmation:${project.id}`,projectId:project.id,kind:'CONFIRMATION',revision:1,payload:{
      recipient:recipient.data,subject:`New Job: ${input.projectName} | ${number}`,
      text:`${input.projectName} | ${number}\n\nSubmitted SOW (version 1)\n\n${input.sow}\n\nhttps://www.talentearth.com/admin/incoming?project=${encodeURIComponent(project.id)}`,
    }}});
    return project;
  });
}

export async function lockJob(tx:Prisma.TransactionClient,id:string) {
  await tx.$queryRaw`SELECT id FROM "Project" WHERE id=${id} FOR UPDATE`;
  const p = await tx.project.findUnique({where:{id}});
  if (!p?.jobNumber) throw new WorkflowError('Numbered job not found.',404);
  return p;
}
const editInput = z.discriminatedUnion('action',[
  z.object({action:z.literal('save'),revision:z.number().int().positive(),sow:z.string().trim().min(1).max(100_000)}),
  z.object({action:z.literal('approve'),revision:z.number().int().positive()}),
]);
export async function reviewJob(id:string,userId:string,raw:unknown) {
  const input=editInput.parse(raw);
  return db.$transaction(async tx=>{
    const p=await lockJob(tx,id);
    if(p.sowRevision!==input.revision) throw new WorkflowError('The SOW changed. Reload and review the latest saved version.');
    if(input.action==='save') {
      if(await tx.workflowTask.count({where:{projectId:id,state:'RUNNING',kind:{in:['FOLDER','INVOICE_COPY']}}}))
        throw new WorkflowError('A local file operation is in progress. Reconcile it before changing the approved SOW.');
      if(p.sowBody===input.sow) return p;
      await tx.workflowTask.updateMany({where:{projectId:id,kind:'FOLDER',state:{in:['PENDING','BLOCKED']}},data:{state:'CANCELLED',attention:'SOW changed; waiting for approval.'}});
      await tx.sOW.create({data:{projectId:id,versionNumber:p.sowRevision+1,bodyRichText:input.sow,status:'DRAFT',createdById:userId}});
      return tx.project.update({where:{id},data:{sowBody:input.sow,sowRevision:{increment:1},workflowState:'AWAITING_APPROVAL',status:'SOW_DRAFT',requiresRpmReview:true,
        // Preserve the last approved snapshot as evidence; its revision no longer matches.
        priceApprovedAt:null,priceApprovedById:null,priceApprovedVersion:null}});
    }
    if(!await isActivePriceApprover(tx,userId)) throw new WorkflowError('Only the configured verified owner can approve this SOW.',403);
    if(p.approvedSowRevision===p.sowRevision && p.workflowState!=='AWAITING_APPROVAL') return p;
    const folderName=p.folderName || productionFolderName(p.jobName || p.name,p.jobNumber!);
    await tx.project.update({where:{id},data:{approvedSowRevision:p.sowRevision,approvedSowBody:p.sowBody,workflowApprovedById:userId,workflowApprovedAt:new Date(),
      folderName,workflowState:p.productionFolder?'READY':'FOLDER_PENDING',status:p.productionFolder?'IN_PROGRESS':'SOW_DRAFT',requiresRpmReview:false}});
    if(!p.productionFolder) await tx.workflowTask.create({data:{id:`folder:${id}:${p.sowRevision}`,projectId:id,kind:'FOLDER',revision:p.sowRevision,payload:{projectId:id,jobNumber:p.jobNumber,folderName,parent:PRODUCTION_PARENT}}});
    return tx.project.findUniqueOrThrow({where:{id}});
  });
}

// A claim is durable before any external side effect. Email outcomes are never retried blindly.
export async function claimTask(id:string) {
  return db.$transaction(async tx=>{
    const ref=await tx.workflowTask.findUnique({where:{id}});
    if(!ref) throw new WorkflowError('Task not found.',404);
    const p=await lockJob(tx,ref.projectId);
    let task=await tx.workflowTask.findUniqueOrThrow({where:{id}});
    if(p.status==='CANCELLED')return null;
    if(task.state==='RUNNING' && task.leaseUntil && task.leaseUntil<=new Date()) {
      if(task.kind==='CONFIRMATION') {
        await tx.workflowTask.update({where:{id},data:{state:'REVIEW',attention:'Email outcome unknown; reconcile provider delivery before retrying.'}});
        return null;
      }
      // Filesystem operations verify the immutable job marker and original bytes on every retry.
      task=await tx.workflowTask.update({where:{id},data:{state:'PENDING',attention:'Recovering expired local worker claim.'}});
    }
    if(task.state!=='PENDING' && task.state!=='BLOCKED') return null;
    if(task.kind!=='CONFIRMATION' && (p.approvedSowRevision!==p.sowRevision || p.workflowState==='AWAITING_APPROVAL')) return null;
    return tx.workflowTask.update({where:{id},data:{state:'RUNNING',leaseToken:randomUUID(),leaseUntil:new Date(Date.now()+5*60_000),attempts:{increment:1},attention:null}});
  });
}
export async function finishFolder(id:string,token:string,path:string) {
  return db.$transaction(async tx=>{
    const ref=await tx.workflowTask.findUniqueOrThrow({where:{id}});
    const p=await lockJob(tx,ref.projectId);
    const task=await tx.workflowTask.findUniqueOrThrow({where:{id}});
    if(task.kind!=='FOLDER' || token!==task.leaseToken) throw new WorkflowError('Task lease mismatch.');
    if(task.state==='DONE' && p.productionFolder===path) return p;
    if(task.state!=='RUNNING' || task.revision!==p.sowRevision || p.approvedSowRevision!==p.sowRevision) throw new WorkflowError('Approval or task state changed. Reconcile the folder.');
    if(path!==`${PRODUCTION_PARENT}/${p.folderName}`) throw new WorkflowError('Folder path does not match this job.');
    await tx.workflowTask.update({where:{id},data:{state:'DONE',completedAt:new Date(),result:{path},leaseUntil:null}});
    return tx.project.update({where:{id:p.id},data:{productionFolder:path,workflowState:'READY',status:'IN_PROGRESS'}});
  });
}
export async function failTask(id:string,token:string,attention:string,knownNoSideEffect=false) {
  const changed=await db.workflowTask.updateMany({where:{id,leaseToken:token,state:'RUNNING'},data:{state:knownNoSideEffect?'BLOCKED':'REVIEW',attention:attention.slice(0,2000),leaseUntil:null}});
  if(!changed.count) throw new WorkflowError('Task lease mismatch.');
}
export async function deliverConfirmation(id:string) {
  const task=await claimTask(id);
  if(!task) return;
  const payload=z.object({recipient:z.string().email(),subject:z.string(),text:z.string()}).parse(task.payload);
  if(task.kind!=='CONFIRMATION') {await failTask(id,task.leaseToken!,'Wrong dispatcher for task.',true);return;}
  const key=process.env.RESEND_API_KEY, from=process.env.PROJECT_REQUEST_FROM_EMAIL;
  if(!key||!from) {await failTask(id,task.leaseToken!,'Configure the approved email provider and sender.',true);return;}
  try {
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from,to:[payload.recipient],subject:payload.subject,text:payload.text}),signal:AbortSignal.timeout(15_000)});
    const result=await response.json();
    if(!response.ok || typeof result.id!=='string') throw new Error('Provider did not confirm delivery acceptance.');
    await db.workflowTask.updateMany({where:{id,leaseToken:task.leaseToken,state:'RUNNING'},data:{state:'DONE',completedAt:new Date(),result:{providerId:result.id},leaseUntil:null}});
  } catch {
    await failTask(id,task.leaseToken!,'Email acceptance is uncertain. Check provider delivery history before any resend.');
  }
}
