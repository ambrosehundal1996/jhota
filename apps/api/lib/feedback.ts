import { z } from 'zod';
import { optionalEnv } from './env.js';

export const feedbackRequestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  displayName: z.string().trim().max(80).nullish(),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;

export function feedbackEmail(): string {
  return optionalEnv('FEEDBACK_EMAIL', 'ambrosehundal0082@gmail.com');
}

/** Best-effort email. Returns false when nothing is configured or the provider rejects. */
export async function sendFeedbackEmail(args: {
  message: string;
  displayName: string | null;
  userId: string | null;
}): Promise<boolean> {
  const to = feedbackEmail();
  const fromName = args.displayName?.trim() || 'Jota tester';
  const text = args.userId ? `${args.message}\n\n— ${fromName}\nuser: ${args.userId}` : `${args.message}\n\n— ${fromName}`;
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    const from = optionalEnv('FEEDBACK_FROM_EMAIL', 'Jota <beth.t@example.com>');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${resendKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: 'Jota beta feedback', text }),
    });
    if (!response.ok) {
      console.error('[feedback] resend failed', response.status, await response.text().catch(() => ''));
      return false;
    }
    return true;
  }

  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(to)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      _subject: 'Jota beta feedback',
      name: fromName,
      message: text,
      _captcha: 'false',
    }),
  });
  if (!response.ok) {
    console.error('[feedback] formsubmit failed', response.status, await response.text().catch(() => ''));
    return false;
  }
  return true;
}
