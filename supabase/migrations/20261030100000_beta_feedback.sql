-- Beta tester notes from the in-app feedback form. Writes go through the
-- API service role only; testers never query this table from the client.

create table public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  display_name text,
  message text not null check (char_length(message) between 1 and 1500),
  created_at timestamptz not null default now()
);

create index beta_feedback_created_idx on public.beta_feedback (created_at desc);

alter table public.beta_feedback enable row level security;
