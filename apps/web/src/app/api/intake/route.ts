import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import crypto from "crypto"; 

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, company, projectType, timeline, budgetRange, message, talentSlug } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Build prompt for AI
        const promptContext = `
Client Name: ${name}
Company: ${company || "N/A"}
Selected Discipline: ${projectType}
Timeline: ${timeline}
Budget Range: ${budgetRange}
Project Details: ${message}
        `;

        // We will "simulate" the AI locally if OPENAI_API_KEY is missing during demo
        let aiResult = {
            confidenceScore: 90,
            urgencyScore: 50,
            complexityScore: 50,
            projectSummary: "Project request for " + projectType,
            deliverables: ["Deliverable 1", "Deliverable 2"],
            missingInfo: "None",
            recommendedAutoRoute: true,
            estimatedBudget: budgetRange,
        };

        if (process.env.OPENAI_API_KEY) {
            try {
                const { object } = await generateObject({
                    model: openai("gpt-4o"),
                    schema: z.object({
                        confidenceScore: z.number().describe("0-100 score of how clear the scope is."),
                        urgencyScore: z.number().describe("0-100 score on urgency."),
                        complexityScore: z.number().describe("0-100 score on complexity."),
                        projectSummary: z.string().describe("1-2 sentence professional summary."),
                        deliverables: z.array(z.string()).describe("List of concrete deliverables."),
                        missingInfo: z.string().describe("Any missing critical info like budget or timeline."),
                        recommendedAutoRoute: z.boolean().describe("True if scope is clear and fits within budget."),
                        estimatedBudget: z.string().describe("Parsed budget range.")
                    }),
                    prompt: `Analyze the following project intake and structure it. \n${promptContext}`
                });
                aiResult = object;
            } catch (e) {
                console.error("AI Generation Failed, using fallback", e);
            }
        } else {
            console.warn("No OPENAI_API_KEY found, using mock AI result for SOW generation.");
            // Determine some mock logic
            if (message.length < 50 || budgetRange.includes("10k")) {
                aiResult.confidenceScore = 60;
                aiResult.recommendedAutoRoute = false;
                aiResult.missingInfo = "Please provide more detail on the specific deliverables.";
            }
        }

        // 1. Create the Client (or find existing by email) -> ignoring complex lookup for Phase 1 demo
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

        const requiresRpmReview = !aiResult.recommendedAutoRoute || aiResult.confidenceScore < 85;

        // Ensure we have an admin ID for the creator (mocking for now as system-generated)
        const systemAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
        const createdById = systemAdmin ? systemAdmin.id : "system"; // Should probably ensure a system user exists

        // Determine Routing match if AutoRoute is true
        let matchedTalentId = null;
        if (!requiresRpmReview) {
            // Pick a default talent for Phase 2 automation testing
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
                budgetRange: aiResult.estimatedBudget,
                timeline: timeline,
                clientId: client.id,
                createdById: createdById, // Mandatory field
                status: matchedTalentId ? "APPROVED_FOR_SOW" : "SOW_DRAFT",
                aiConfidenceScore: aiResult.confidenceScore,
                urgencyScore: aiResult.urgencyScore,
                complexityScore: aiResult.complexityScore,
                isAutoRouted: !requiresRpmReview,
                requiresRpmReview: requiresRpmReview,
                exceptionReason: requiresRpmReview ? aiResult.missingInfo : null,
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
                      routingDecision: "AI confidence > 85%. Automated best-match selection executed."
                  }
             });
        }

        // 3. Draft the SOW
        const sowBodyText = `
## Project Summary
${aiResult.projectSummary}

## Objectives
Successfully deliver the requested ${projectType} within the ${timeline} timeframe.

## Deliverables
${aiResult.deliverables.map(d => `- ${d}`).join('\n')}

## Estimated Budget
${aiResult.estimatedBudget}

## Notes
${aiResult.missingInfo !== "None" ? `**Pending Clarification:** ${aiResult.missingInfo}` : "All standard variables present."}
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

        // Note: For Phase 2 we return the shareToken to the client so the redirect/test can use it
        return NextResponse.json({ success: true, projectId: project.id, requiresRpmReview, shareToken });

    } catch (error) {
        console.error("Intake System Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
