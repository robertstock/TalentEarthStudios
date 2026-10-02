import { db } from "@/lib/db";
import { sendProjectRequestNotification } from "@/lib/email";

export async function deliverMobileNotification(submissionId: string) {
  const submission = await db.mobileSubmission.findUnique({
    where: { id: submissionId },
    include: { project: { include: { client: true } } },
  });
  if (!submission || submission.notificationSentAt) return true;
  const project = submission.project;
  if(project.jobNumber) return false; // Numbered jobs use the single durable confirmation outbox.
  const sent = await sendProjectRequestNotification(
    {
      requestId: submission.id,
      projectId: project.id,
      projectName: project.name,
      clientName: project.client?.companyName,
      contactName: project.client?.primaryContactName,
      contactEmail: project.client?.email,
      description: project.description,
      status: project.status,
      dashboardPath: "/admin/incoming",
    },
    `mobile-project/${submission.id}`,
  );
  if (sent)
    await db.mobileSubmission.update({
      where: { id: submission.id },
      data: { notificationSentAt: new Date() },
    });
  return sent;
}
