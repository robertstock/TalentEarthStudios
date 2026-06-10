const { openai } = require('@ai-sdk/openai');
const { tool } = require('ai');
const { z } = require('zod');

const myTool = tool({
  description: "Test tool",
  parameters: z.object({
    name: z.string()
  }),
  execute: async () => {}
});

console.log(JSON.stringify(myTool, null, 2));
