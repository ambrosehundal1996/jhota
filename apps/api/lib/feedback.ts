import { z } from 'zod';

export const feedbackRequestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  displayName: z.string().trim().max(80).nullish(),
});

export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
