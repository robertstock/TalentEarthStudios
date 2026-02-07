import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // precise mock SOW generation
        const project = await db.project.findUnique({
            where: { id },
            include: {
                client: true,
                createdBy: true,
                answers: {
                    include: { question: true }
                }
            }
        });

        if (!project) return NextResponse.json({ message: "Project not found" }, { status: 404 });

        // Extract details from answers since Project model doesn't store them directly
        const getAnswer = (qmMatcher: (q: any) => boolean) => {
            const ans = project.answers.find(a => qmMatcher(a.question));
            return ans?.valueText || 'N/A';
        };

        const description = getAnswer(q => q.type === 'LONG_TEXT' || q.prompt.includes('Description'));
        const budget = getAnswer(q => q.prompt.includes('Budget'));
        const deliveryDate = getAnswer(q => q.type === 'DATE' || q.prompt.includes('Delivery'));

        // Generate mock content based on project details
        const sowContent = `
# Statement of Work: ${project.name}
**Client:** ${project.client?.companyName || 'N/A'}
**Date:** ${new Date().toLocaleDateString()}

## 1. Project Overview
${description}

## 2. Scope of Services
- Pre-production: Concept, script, and storyboard.
- Production: Filming on location (1 day).
- Post-production: Editing, color grading, sound mixing.

## 3. Timeline
Target Delivery: ${deliveryDate}

## 4. Financials
Budget Range: ${budget}
        `.trim();

        // Create SOW record
        const sow = await db.sOW.create({
            data: {
                projectId: id,
                versionNumber: 1,
                status: 'DRAFT',
                bodyRichText: sowContent,
                createdById: (await db.user.findFirst({ where: { role: 'ADMIN' } }))?.id || ''
            }
        });

        // Update Project status to indicate an SOW has been drafted
        await db.project.update({
            where: { id },
            data: { status: 'SOW_DRAFT' }
        });

        return NextResponse.json({
            ...sow,
            projectCreator: project.createdBy
        });

    } catch (error) {
        console.error("GENERATE_SOW_ERROR", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
