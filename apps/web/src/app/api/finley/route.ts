import { openai } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { db } from "@/lib/db";
import crypto from "crypto";
import { specialtyData, SpecialtySlug } from "@/lib/specialty-data";

// Set max duration for edge functions (if deployed to Vercel edge)
export const maxDuration = 60;

// Model selection — override via FINLEY_MODEL env var (e.g. "gpt-4o")
const FINLEY_MODEL = process.env.FINLEY_MODEL ?? "gpt-4o";

export async function POST(req: Request) {
  const { messages, team } = await req.json();

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
    messages,
    tools: {
      submit_project_intake: tool({
        description: "Submit the gathered project details to the TalentEarthStudios execution layer. Only call this when all required fields have been collected.",
        parameters: z.object({
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
        execute: async ({
          name, email, company, projectType, timeline, budgetRange, message,
          confidenceScore, urgencyScore, complexityScore, projectSummary, deliverables, missingInfo, recommendedAutoRoute
        }) => {
          try {
            // 1. Create or find the Client
            let client = await db.client.findFirst({ where: { email } });
            if (!client) {
              client = await db.client.create({
                data: {
                  companyName: company || name,
                  primaryContactName: name,
                  email,
                }
              });
            }

            const requiresRpmReview = !recommendedAutoRoute || confidenceScore < 85;

            // Ensure we have an admin ID for the creator
            const systemAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
            const createdById = systemAdmin ? systemAdmin.id : "system";

            // Determine Routing match if AutoRoute is true
            let matchedTalentId = null;
            if (!requiresRpmReview) {
              const availableTalent = await db.talent.findFirst({
                select: { id: true, name: true }
              });
              if (availableTalent) {
                matchedTalentId = availableTalent.id;
              }
            }

            // 2. Create the Project
            const project = await db.project.create({
              data: {
                name: `${company || name} - ${projectType}`,
                description: message,
                budgetRange: budgetRange,
                timeline: timeline,
                clientId: client.id,
                createdById: createdById,
                status: matchedTalentId ? "APPROVED_FOR_SOW" : "SOW_DRAFT",
                aiConfidenceScore: confidenceScore,
                urgencyScore: urgencyScore,
                complexityScore: complexityScore,
                isAutoRouted: !requiresRpmReview,
                requiresRpmReview: requiresRpmReview,
                exceptionReason: requiresRpmReview ? missingInfo : null,
                talentId: matchedTalentId,
              }
            });

            // Create Routing Log if auto-routed
            if (matchedTalentId) {
              await db.routingLog.create({
                data: {
                  projectId: project.id,
                  talentScanned: 1,
                  selectedTalentId: matchedTalentId,
                  routingDecision: "AI confidence > 85%. Automated best-match selection executed by Finley."
                }
              });
            }

            // 3. Draft the SOW
            const sowBodyText = `
## Project Summary
${projectSummary}

## Objectives
Successfully deliver the requested ${projectType} within the ${timeline} timeframe.

## Deliverables
${deliverables.map(d => `- ${d}`).join('\n')}

## Estimated Budget
${budgetRange}

## Notes
${missingInfo !== "None" ? `**Pending Clarification:** ${missingInfo}` : "All standard variables present."}
            `.trim();

            const shareToken = crypto.randomBytes(16).toString("hex");

            await db.sOW.create({
              data: {
                projectId: project.id,
                versionNumber: 1,
                status: "DRAFT",
                bodyRichText: sowBodyText,
                createdById: createdById,
                shareToken: shareToken,
              }
            });

            return {
              success: true,
              projectId: project.id,
              message: "Project successfully transmitted to execution layer."
            };
          } catch (error) {
            console.error("Finley Intake Tool Error:", error);
            return {
              success: false,
              message: "An internal error occurred while saving the project."
            };
          }
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
