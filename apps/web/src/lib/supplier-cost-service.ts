import type { Prisma } from '@prisma/client';
import { supplierDetailsSchema, supplierDuplicateKey } from './invoice-workflow';
import { WorkflowError } from './job-workflow-rules';

// Both the existing review route and intake worker use this business-validation boundary.
export async function saveSupplierCosts(tx:Prisma.TransactionClient,projectId:string,documentId:string,raw:unknown,approve:boolean) {
 const details=supplierDetailsSchema.parse(raw);
 await tx.$queryRaw`SELECT id FROM "Project" WHERE id=${projectId} FOR UPDATE`;
 const doc=await tx.supplierInvoice.findFirst({where:{id:documentId,projectId},include:{project:true}});
 if(!doc)throw new WorkflowError('Invoice not found.',404);
 if(doc.project.status==='CANCELLED')throw new WorkflowError('Reopen the job before changing costs.');
 if(doc.project.jobNumber && (doc.project.approvedSowRevision!==doc.project.sowRevision || doc.project.workflowState!=='READY' || !doc.project.productionFolder))
  throw new WorkflowError('Costs are queued until the latest SOW is approved and its production folder acknowledged.');
 if(doc.status==='APPROVED')return;
 const updated=await tx.supplierInvoice.updateMany({where:{id:documentId,status:'DRAFT'},data:{details,duplicateKey:supplierDuplicateKey(details.supplier,details.invoiceNumber),...(approve?{status:'APPROVED',approvedAt:new Date()}: {})}});
 if(approve && updated.count)await tx.vendorBill.createMany({data:details.lines.map(line=>({projectId,supplierInvoiceId:documentId,category:line.category,vendorName:line.description,amount:line.amount,status:details.paymentStatus,date:new Date(`${details.date}T12:00:00Z`),documentUrl:`/api/admin/projects/${projectId}/supplier-invoices/${documentId}`}))});
}
