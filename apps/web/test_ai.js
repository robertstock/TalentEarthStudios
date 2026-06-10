const { openai } = require('@ai-sdk/openai');
const { streamText, tool } = require('ai');
const { z } = require('zod');

async function main() {
  try {
    const result = streamText({
      model: openai('gpt-4o'),
      prompt: "hi",
      tools: {
        my_tool: tool({
          description: "A tool",
          parameters: z.object({
            name: z.string()
          }),
          execute: async () => "hello"
        })
      }
    });

    for await (const chunk of result.fullStream) {
        console.log(chunk);
    }
  } catch (e) {
    console.error(e);
  }
}
main();
