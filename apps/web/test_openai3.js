const { createOpenAI } = require('@ai-sdk/openai');
const { streamText, tool, jsonSchema } = require('ai');

async function main() {
  const customFetch = async (url, init) => {
    console.log("REQUEST BODY:");
    console.log(JSON.stringify(JSON.parse(init.body), null, 2));
    throw new Error("Intercepted");
  };

  const openai = createOpenAI({ apiKey: 'fake', fetch: customFetch });

  const result = streamText({
    model: openai('gpt-4o', { structuredOutputs: true }),
    prompt: "hi",
    tools: {
      submit_project_intake: tool({
        description: "Submit the gathered project details...",
        parameters: jsonSchema({
          type: "object",
          properties: {
            name: { type: "string", description: "The client's full name" },
            email: { type: "string", description: "The client's email address" }
          },
          required: ["name", "email"]
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
