-- Confidence metadata for AI photo estimates. Stored once per analysis (one meal);
-- food_logs keep linking to it through ai_analysis_id.
alter table public.ai_photo_analyses
  add column if not exists prompt_version text,
  add column if not exists estimate jsonb,
  add column if not exists overall_confidence text
    check (overall_confidence in ('high', 'medium', 'low')),
  add column if not exists review_notes jsonb,
  add column if not exists needs_clarification boolean;

comment on column public.ai_photo_analyses.estimate is
  'Normalized estimate returned to the app, including per-item confidence and uncertainty_reasons.';
comment on column public.ai_photo_analyses.overall_confidence is
  'Qualitative rating computed from item confidence weighted by protein share. Not a probability.';
