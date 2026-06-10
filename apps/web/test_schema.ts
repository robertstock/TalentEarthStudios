import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const schema = z.object({
          name: z.string().describe("The client's full name"),
          email: z.string().email().describe("The client's email address"),
          company: z.string().optional().describe("The client's company or organization"),
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
        });

console.log(JSON.stringify(zodToJsonSchema(schema), null, 2));
