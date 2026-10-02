import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { db } from '@/lib/db';
import { claimTask, finishFolder, failTask, deliverConfirmation } from '@/lib/job-workflow';
import { stageInvoice,queueInvoiceCopies,finishInvoice } from '@/lib/job-invoices';
import { WorkflowError } from '@/lib/job-workflow-rules';
import { requireSameOrigin } from '@/lib/invoice-api';
import { canApprovePrice } from '@/lib/price-approval';
import { z } from 'zod';
export const runtime='nodejs';
export async function GET(req:Request){
 const auth=await requireAdmin();if(auth.error)return auth.error;
 const query=new URL(req.url).searchParams;
 const originalId=query.get('originalInvoice');
 if(originalId){
  const item=await db.inboundInvoice.findUnique({where:{id:originalId}});
  if(!item)return NextResponse.json({message:'Invoice not found.'},{status:404});
  return new Response(new Uint8Array(item.fileData),{headers:{'Content-Type':item.mimeType,'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(item.fileName)}`,'Cache-Control':'private, no-store','Content-Security-Policy':'sandbox','X-Content-Type-Options':'nosniff'}});
 }
 const id=query.get('originalTask');
 if(id){
  const task=await db.workflowTask.findUnique({where:{id}});
  if(!task||task.kind!=='INVOICE_COPY'||task.state!=='RUNNING')return NextResponse.json({message:'Claim an invoice task first.'},{status:409});
  const payload=z.object({invoiceId:z.string()}).parse(task.payload);
  const item=await db.inboundInvoice.findUniqueOrThrow({where:{id:payload.invoiceId}});
  return new Response(new Uint8Array(item.fileData),{headers:{'Content-Type':item.mimeType,'Cache-Control':'private, no-store','Content-Security-Policy':'sandbox','X-Content-Type-Options':'nosniff'}});
 }
 return NextResponse.json({tasks:await db.workflowTask.findMany({where:{state:{notIn:['DONE','CANCELLED']}},include:{project:{select:{jobNumber:true,name:true,workflowState:true}}},take:100,orderBy:{createdAt:'asc'}}),invoices:await db.inboundInvoice.findMany({where:{state:{not:'IMPORTED'}},select:{id:true,jobNumber:true,state:true,attention:true,fileName:true,details:true,sourceMessageIds:true,projectId:true},take:100,orderBy:{createdAt:'asc'}})});
}
export async function POST(req:Request){
 const auth=await requireAdmin();if(auth.error)return auth.error;
 try{
  requireSameOrigin(req);
  if(req.headers.get('content-type')?.startsWith('multipart/form-data')){
   const form=await req.formData(),file=form.get('file');
   if(!(file instanceof File))throw new WorkflowError('Original attachment required.',400);
   return NextResponse.json(await stageInvoice(JSON.parse(String(form.get('metadata'))),new Uint8Array(await file.arrayBuffer())));
  }
  const b=await req.json();const id=z.string().min(1).parse(b.taskId);
  switch(b.action){
   case 'claim':return NextResponse.json(await claimTask(id));
   case 'folder-complete':{
    const p=await finishFolder(id,z.string().parse(b.token),z.string().parse(b.path));
    await queueInvoiceCopies(p.id);return NextResponse.json({success:true});
   }
   case 'invoice-complete':return NextResponse.json(await finishInvoice(id,z.string().parse(b.token),z.string().parse(b.path),z.string().parse(b.sha256),auth.session!.user.id));
   case 'fail':await failTask(id,z.string().parse(b.token),z.string().parse(b.attention));break;
   case 'deliver-confirmation':await deliverConfirmation(id);break;
   case 'reconcile':{
    if(!canApprovePrice(auth.session!.user.id))throw new WorkflowError('Owner reconciliation required.',403);
    const task=await db.workflowTask.findUniqueOrThrow({where:{id}});
    if(task.state!=='REVIEW')throw new WorkflowError('Task is not awaiting reconciliation.');
    const note=z.string().trim().min(10).max(2000).parse(b.note);
    if(task.kind==='CONFIRMATION'){
     // Record verified provider acceptance. This endpoint cannot blindly resend uncertain mail.
     const providerId=z.string().min(1).max(200).parse(b.providerId);
     await db.workflowTask.update({where:{id},data:{state:'DONE',completedAt:new Date(),attention:note,result:{providerId,reconciledBy:auth.session!.user.id}}});
    }else{
     await db.workflowTask.update({where:{id},data:{state:'PENDING',leaseToken:null,leaseUntil:null,attention:note}});
    }
    break;
   }
   default:throw new WorkflowError('Unknown workflow action.',400);
  }
  return NextResponse.json({success:true});
 }catch(e){return NextResponse.json({message:e instanceof WorkflowError?e.message:'Unable to complete this step; review task state before retrying.'},{status:e instanceof WorkflowError?e.status:e instanceof z.ZodError?400:500});}
}
