-- Optional notes on a food log (e.g. AI photo ingredient breakdown).
alter table public.food_logs
  add column if not exists notes text;
