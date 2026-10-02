import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { after } from "next/server";
import { submitFinleyJob, deliverConfirmation } from "@/lib/job-workflow";
import { WorkflowError } from "@/lib/job-workflow-rules";
import { specialtyData, SpecialtySlug } from "@/lib/specialty-data";

// Set max duration for edge functions (if deployed to Vercel edge)
export const maxDuration = 60;

// Model selection — override via FINLEY_MODEL env var (e.g. "gpt-4o")
const FINLEY_MODEL = process.env.FINLEY_MODEL ?? "gpt-4o";

export async function POST(req: Request) {
  const requestBody = await req.json();
  const { messages, team, submissionId } = requestBody;

  // Pre-process messages to parse PDF attachments into text content to prevent OpenAI API from crashing
  const processedMessages = [];
  for (const message of messages) {
    let content = message.content || "";
    const attachments = message.experimental_attachments || [];
    const newAttachments = [];

    for (const attachment of attachments) {
      if (attachment.contentType === "application/pdf" || attachment.name?.endsWith(".pdf")) {
        try {
          const base64Data = attachment.url.split(";base64,").pop();
          if (base64Data) {
            const buf = Buffer.from(base64Data, "base64");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const pdf = require("pdf-parse");
            const instance = new pdf.PDFParse(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
            const parsed = await instance.getText();
            const extractedText = parsed?.text || "";
            content += `\n\n[Attached PDF Document: ${attachment.name}]\n${extractedText}`;
          }
        } catch (err) {
          console.error("Failed to parse PDF attachment:", err);
          content += `\n\n[Attached PDF Document: ${attachment.name} (Failed to parse text)]`;
        }
      } else {
        newAttachments.push(attachment);
      }
    }

    processedMessages.push({
      ...message,
      content,
      experimental_attachments: newAttachments.length > 0 ? newAttachments : undefined,
    });
  }
  let teamContext = "";
  if (team && specialtyData[team as SpecialtySlug]) {
    const data = specialtyData[team as SpecialtySlug];
    teamContext = `\n\nCRITICAL CONTEXT:\nThe user has explicitly requested to start a project with our **${data.title}** team.\nTeam Expertise/Bio: ${data.bio}\n\nINSTRUCTION: Please significantly tailor your follow-up questions to gather requirements highly relevant to this specific discipline based on the bio. For example, if it's Visual Media, ask about physical dimensions, install locations, or materials. If it's Film/Video, ask about runtime or format. If it's Audio, ask about instrumentation or mood.`;
  }

  const systemPrompt = `
You are Finley, the AI Project Manager for TalentEarthStudios.
Your goal is to warmly welcome clients and gather their project details in an organized, conversational manner to develop a Statement of Work (SOW).

You must collect the following information from the user before submitting the project:
1. Client's Full Name
2. Email Address
3. Company/Organization (Optional, but ask)
4. Project Discipline/Type (e.g., Film Production, Experiential, Audio, VFX, etc.)
5. Project Scope/Description (What are the primary objectives and deliverables?)
6. Estimated Timeline (Desired deadline or timeframe)
7. Estimated Budget Range
8. Project Name (ask the client; do not invent it)

Instructions:
- Be concise, professional, yet warm and cinematic in your tone.
- Do NOT ask for all information at once. This is an interactive interview. You must guide them step by step. 
- Ask exactly 1 or 2 questions at most per message.
- Acknowledge their inputs affirmatively before moving to the next question.
- Once you have gathered ALL the required information, use the "submit_project_intake" tool to securely transmit their project to our execution layer.
- After successfully calling the tool, thank them and let them know the execution team will reach out shortly. Do not ask any more questions after submission.${teamContext}
`;

  const result = streamText({
    model: openai(FINLEY_MODEL, { structuredOutputs: false }),
    system: systemPrompt,
    messages: processedMessages,
    tools: {
      submit_project_intake: tool({
        description: "Submit the gathered project details to the TalentEarthStudios execution layer. Only call this when all required fields have been collected.",
        parameters: z.object({
          projectName: z.string().min(1).max(160).describe("The project name confirmed by the client"),
          name: z.string().describe("The client's full name"),
          email: z.string().email().describe("The client's email address"),
          company: z.string().describe("The client's company or organization. Use an empty string if not provided."),
          projectType: z.string().describe("The discipline or type of project"),
          timeline: z.string().describe("The estimated timeline"),
          budgetRange: z.string().describe("The estimated budget range"),
          message: z.string().describe("The detailed project scope/description"),
          confidenceScore: z.number().describe("0-100 score of how clear the scope is based on the conversation"),
          urgencyScore: z.number().describe("0-100 score on urgency"),
          complexityScore: z.number().describe("0-100 score on complexity"),
          projectSummary: z.string().describe("1-2 sentence professional summary of the project"),
          deliverables: z.array(z.string()).describe("List of concrete deliverables mentioned or inferred"),
          missingInfo: z.string().describe("Any missing critical info (put 'None' if all good)"),
          recommendedAutoRoute: z.boolean().describe("True if scope is clear and fits within standard parameters")
        }),
        execute: async (input) => {
          try {
            const sow = `${input.projectSummary}\n\nScope\n${input.message}\n\nDeliverables\n${input.deliverables.map(d=>`- ${d}`).join('\n')}\n\nTimeline: ${input.timeline}\nBudget: ${input.budgetRange}\nOpen questions: ${input.missingInfo}`;
            const project=await submitFinleyJob({...input,submissionId,sow},requestBody);
            after(()=>deliverConfirmation(`confirmation:${project.id}`));
            return {success:true,projectId:project.id,jobNumber:project.jobNumber,message:`${project.name} | ${project.jobNumber} is awaiting approval.`};
          } catch(e) {
            return {success:false,message:e instanceof WorkflowError?e.message:'Unable to save. Keep your draft and retry.'};
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
