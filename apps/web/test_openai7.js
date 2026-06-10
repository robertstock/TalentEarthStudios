const { createOpenAI } = require('@ai-sdk/openai');
const { streamText, tool } = require('ai');
const { z } = require('zod');

async function main() {
  const customFetch = async (url, init) => {
    console.log("URL:", url);
    console.log("BODY:", init.body);
    throw new Error("Intercepted");
  };

  const openai = createOpenAI({ apiKey: 'fake', fetch: customFetch });

  const result = streamText({
    model: openai.chat('gpt-4o'),
    prompt: "hi",
    tools: {
      submit_project_intake: tool({
        description: "Submit the gathered project details...",
        parameters: z.object({
          name: z.string()
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
