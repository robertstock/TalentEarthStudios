const { createOpenAI } = require('@ai-sdk/openai');
const { streamText, tool } = require('ai');
const { z } = require('zod');

async function main() {
  const customFetch = async (url, init) => {
    console.log("REQUEST BODY:");
    console.log(JSON.stringify(JSON.parse(init.body), null, 2));
    throw new Error("Intercepted");
  };

  const openai = createOpenAI({ apiKey: 'fake', fetch: customFetch });

  const result = streamText({
    model: openai('gpt-4o', { structuredOutputs: false }),
    prompt: "hi",
    tools: {
      submit_project_intake: tool({
        description: "Submit the gathered project details...",
        parameters: z.object({
          name: z.string().describe("The client's full name"),
          email: z.string().email().describe("The client's email address")
        }),
        execute: async () => {}
      })
    }
  });

  try {
    for await (const chunk of result.fullStream) {}
  } catch (e) {}
}
main();
