import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { db } from '@/lib/db';
import { requireSameOrigin } from '@/lib/invoice-api';
import { queueInvoiceCopies } from '@/lib/job-invoices';
import { reviewJob } from '@/lib/job-workflow';
import { WorkflowError } from '@/lib/job-workflow-rules';
export async function GET(_:Request,ctx:{params:Promise<{id:string}>}) {
 const auth=await requireAdmin();if(auth.error)return auth.error;
 const {id}=await ctx.params;
 return NextResponse.json(await db.project.findUnique({where:{id},include:{workflowTasks:true,inboundInvoices:{select:{id:true,state:true,attention:true,fileName:true,localPath:true}}}}));
}
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}) {
 const auth=await requireAdmin();if(auth.error)return auth.error;
 try{requireSameOrigin(req);const p=await reviewJob((await ctx.params).id,auth.session!.user.id,await req.json());await queueInvoiceCopies(p.id);return NextResponse.json(p);}
 catch(e){return NextResponse.json({message:e instanceof WorkflowError?e.message:'Invalid workflow request.'},{status:e instanceof WorkflowError?e.status:e instanceof ZodError?400:500});}
}
