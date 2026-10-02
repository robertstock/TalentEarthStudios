// Only preload in an isolated local integration-test process. Never imported by application code.
import { appendFileSync } from 'node:fs';
if (process.env.MOBILE_TEST_PROVIDERS !== '1' || process.env.NODE_ENV === 'production' || new URL(process.env.DATABASE_URL).hostname !== '127.0.0.1') throw new Error('Test providers require an explicitly enabled, local-only database.');
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url || String(input);
  if (url.startsWith('https://api.resend.com/emails')) {
    const payload = JSON.parse(init.body);
    appendFileSync('/private/tmp/talentearth-mobile-test-mail.jsonl', JSON.stringify(payload) + '\n');
    return Response.json({ id: 'test-mail-id' });
  }
  if (url === 'https://api.openai.com/v1/audio/transcriptions') return Response.json({ text: 'We need a 30 second film for our coffee shop. Please show the barista and the new seasonal drinks. We need it next month. Our budget is not decided.' });
  if (url === 'https://api.openai.com/v1/chat/completions') return Response.json({ choices: [{ message: { content: JSON.stringify({ name: 'Coffee shop launch film', summary: 'Create a 30-second film for a coffee shop, featuring the barista and new seasonal drinks.\n\nTiming: next month.\nBudget: to be confirmed.' }) } }] });
  return originalFetch(input, init);
};
