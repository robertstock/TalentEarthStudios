import { NextResponse, after } from 'next/server';
import { submitFinleyJob, deliverConfirmation } from '@/lib/job-workflow';
import { WorkflowError } from '@/lib/job-workflow-rules';
import { ZodError } from 'zod';
export async function POST(req:Request) {
 try {
  const b=await req.json();
  const p=await submitFinleyJob({submissionId:b.submissionId,projectName:b.projectName,name:b.name,email:b.email,company:b.company,timeline:b.timeline,budgetRange:b.budgetRange,sow:b.message},b);
  after(()=>deliverConfirmation(`confirmation:${p.id}`));
  return NextResponse.json({success:true,projectId:p.id,jobNumber:p.jobNumber,requiresRpmReview:true});
 }catch(e){return NextResponse.json({error:e instanceof WorkflowError?e.message:'Invalid project submission.'},{status:e instanceof WorkflowError?e.status:e instanceof ZodError?400:500});}
}
