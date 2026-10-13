import { aiEstimateJsonSchema, aiEstimateSchema, type AiEstimate } from '@steady/domain';
import { HttpError, optionalEnv, requireEnv } from '../env.js';

export const SYSTEM_PROMPT = [
  'You estimate the protein content of meals from photos for a protein-tracking app.',
  'Identify each distinct food or drink that is visible, estimate a realistic portion, and estimate grams of protein for that portion.',
  'Use typical nutrition values. Be conservative and realistic, never precise-sounding.',
  'If the user gives context (portion sizes, ingredients, brands), trust it over what you see.',
  'Combine trivial garnishes into the main item. Use at most 8 items.',
  'total_protein_g must equal the sum of item protein_g, rounded to a whole number.',
  'If the image does not show food or drink, set is_food to false and return no items.',
].join(' ');

interface ResponsesOutput {
  output?: { type?: string; content?: { type?: string; text?: string; refusal?: string }[] }[];
  error?: { message?: string };
}

export function extractOutputText(body: ResponsesOutput): string {
  for (const item of body.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === 'refusal') throw new HttpError(422, 'ai_refused', 'We could not analyze this photo.');
      if (part.type === 'output_text' && part.text) return part.text;
    }
  }
  throw new HttpError(502, 'ai_empty', 'The estimate came back empty. Please try again.');
}

/** Normalizes model output: rounds values and recomputes the total from the items. */
export function finalizeEstimate(estimate: AiEstimate): AiEstimate {
  const items = estimate.items
    .filter(item => item.name.trim())
    .map(item => ({ ...item, name: item.name.trim(), protein_g: Math.round(item.protein_g) }));
  const total = items.reduce((sum, item) => sum + item.protein_g, 0);
  return { ...estimate, items, total_protein_g: items.length ? total : Math.round(estimate.total_protein_g) };
}

export async function analyzeMealPhoto(args: {
  imageUrl: string;
  userContext?: string;
}): Promise<{ estimate: AiEstimate; raw: unknown; model: string }> {
  const model = optionalEnv('OPENAI_VISION_MODEL', 'gpt-5-mini');
  const userText = args.userContext?.trim()
    ? `Estimate the protein in this meal. Context from the user: "${args.userContext.trim()}"`
    : 'Estimate the protein in this meal.';

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${requireEnv('OPENAI_API_KEY')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: SYSTEM_PROMPT }] },
        {
          role: 'user',
          content: [
            { type: 'input_text', text: userText },
            { type: 'input_image', image_url: args.imageUrl, detail: 'auto' },
          ],
        },
      ],
      text: { format: { type: 'json_schema', ...aiEstimateJsonSchema } },
    }),
    signal: AbortSignal.timeout(50_000),
  });

  const body = (await response.json().catch(() => ({}))) as ResponsesOutput;
  if (!response.ok) {
    console.error('[ai] OpenAI error', response.status, body.error?.message);
    throw new HttpError(502, 'ai_unavailable', 'Photo analysis is temporarily unavailable.');
  }
  const parsed = aiEstimateSchema.safeParse(JSON.parse(extractOutputText(body)));
  if (!parsed.success) throw new HttpError(502, 'ai_invalid', 'We could not read the estimate. Please try again.');
  return { estimate: finalizeEstimate(parsed.data), raw: body, model };
}
