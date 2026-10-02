import { z } from "zod";

export const mobileProjectInput = z.object({
  submissionId: z.string().uuid(),
  name: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(10).max(20_000),
  transcript: z.string().trim().max(40_000).optional(),
});

export function mobileProjectData(
  input: z.infer<typeof mobileProjectInput>,
  clientId: string,
  createdById: string,
) {
  return {
    name: input.name,
    jobName: input.name,
    description: input.summary,
    clientId,
    createdById,
    // This is the existing Incoming filter. No talent assignment or automatic approval.
    status: "SOW_DRAFT" as const,
    isAutoRouted: false,
    requiresRpmReview: true,
    sows: {
      create: {
        versionNumber: 1,
        status: "DRAFT" as const,
        createdById,
        bodyRichText: input.summary,
      },
    },
    meetingNotes: input.transcript
      ? {
          create: {
            title: "Original mobile project transcript",
            content: input.transcript,
          },
        }
      : undefined,
  };
}
