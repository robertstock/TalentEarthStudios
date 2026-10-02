import { after } from 'next/server';
import { mobileProjectInput } from '@/lib/mobile-projects';
import { submitFinleyJob, deliverConfirmation } from '@/lib/job-workflow';
import { WorkflowError } from '@/lib/job-workflow-rules';
import { limitMobileRequests,mobileJson,mobileOptions,mobileRoute,requireMobileAccount,MobileError } from '@/lib/mobile-api';
export const OPTIONS=mobileOptions;
export const POST=(req:Request)=>mobileRoute(req,async()=>{
 const {account}=await requireMobileAccount(req);
 const input=mobileProjectInput.parse(await mobileJson(req));
 await limitMobileRequests('project-submit',account.id,20,3_600_000);
 try {
  const project=await submitFinleyJob({submissionId:input.submissionId,projectName:input.name,name:account.name,email:account.email,sow:input.summary},input,account.id);
  after(()=>deliverConfirmation(`confirmation:${project.id}`));
  return {projectId:project.id,jobNumber:project.jobNumber,submitted:true};
 }catch(e){if(e instanceof WorkflowError)throw new MobileError(e.message,e.status);throw e;}
});
