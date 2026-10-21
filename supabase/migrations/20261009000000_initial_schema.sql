-- Jota initial schema.
-- Every private table is keyed by user_id = auth.uid() and protected by RLS.
-- Client-generated UUID primary keys make offline outbox upserts idempotent.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.goal_type as enum ('build_muscle', 'lose_fat', 'maintain_health', 'eat_more_protein');
create type public.weight_unit as enum ('lb', 'kg');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.log_source as enum (
  'search', 'barcode', 'recent', 'favorite', 'custom', 'quick_add', 'ai_photo', 'saved_meal', 'copy'
);
create type public.food_provider as enum ('usda', 'off', 'custom');
create type public.ai_analysis_status as enum ('pending', 'completed', 'failed', 'confirmed', 'discarded');

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (id = auth user id; survives anonymous -> Apple identity linking)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  goal_type public.goal_type,
  weight_value numeric(6, 1) check (weight_value is null or weight_value > 0),
  weight_unit public.weight_unit not null default 'lb',
  protein_goal_min numeric(6, 1) check (protein_goal_min is null or protein_goal_min > 0),
  protein_goal_max numeric(6, 1) check (protein_goal_max is null or protein_goal_max > 0),
  protein_goal_is_custom boolean not null default false,
  timezone text not null default 'UTC',
  display_name text,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protein_goal_order check (
    protein_goal_min is null or protein_goal_max is null or protein_goal_min <= protein_goal_max
  )
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- custom_foods
-- ---------------------------------------------------------------------------
create table public.custom_foods (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  food_name text not null check (char_length(food_name) between 1 and 120),
  serving_description text not null default '1 serving',
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  calories numeric(7, 1) check (calories is null or calories >= 0),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index custom_foods_user_idx on public.custom_foods (user_id, updated_at desc);
create index custom_foods_name_trgm_idx on public.custom_foods using gin (food_name gin_trgm_ops);
create trigger custom_foods_updated_at before update on public.custom_foods
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- ai_photo_analyses (raw model output vs. user-confirmed result, for accuracy tracking)
-- ---------------------------------------------------------------------------
create table public.ai_photo_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null,
  user_context text,
  status public.ai_analysis_status not null default 'pending',
  model text,
  raw_response jsonb,
  raw_total_g numeric(6, 1),
  final_total_g numeric(6, 1),
  final_items jsonb,
  was_edited boolean,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ai_photo_analyses_user_idx on public.ai_photo_analyses (user_id, created_at desc);
create trigger ai_photo_analyses_updated_at before update on public.ai_photo_analyses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- food_logs
-- ---------------------------------------------------------------------------
create table public.food_logs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  logged_at timestamptz not null default now(),
  meal_type public.meal_type,
  food_name text not null check (char_length(food_name) between 1 and 160),
  brand text,
  serving_quantity numeric(8, 2),
  serving_unit text,
  protein_g numeric(6, 1) not null check (protein_g >= 0 and protein_g <= 1000),
  calories numeric(7, 1),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  source public.log_source not null,
  external_provider public.food_provider,
  external_food_id text,
  custom_food_id uuid references public.custom_foods (id) on delete set null,
  ai_analysis_id uuid references public.ai_photo_analyses (id) on delete set null,
  ai_original_protein_g numeric(6, 1),
  ai_was_edited boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index food_logs_user_date_idx on public.food_logs (user_id, log_date);
create index food_logs_user_recent_idx on public.food_logs (user_id, logged_at desc) where deleted_at is null;
create index food_logs_user_updated_idx on public.food_logs (user_id, updated_at);
create index food_logs_external_idx on public.food_logs (external_provider, external_food_id)
  where external_food_id is not null;
create trigger food_logs_updated_at before update on public.food_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- daily_overrides ("Set Today's Total"): replaces the summed total for one date
-- ---------------------------------------------------------------------------
create table public.daily_overrides (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  protein_total_g numeric(6, 1) not null check (protein_total_g >= 0 and protein_total_g <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint daily_overrides_one_per_day unique (user_id, log_date)
);

create index daily_overrides_user_updated_idx on public.daily_overrides (user_id, updated_at);
create trigger daily_overrides_updated_at before update on public.daily_overrides
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table public.favorites (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  food_name text not null,
  brand text,
  serving_quantity numeric(8, 2),
  serving_unit text,
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  calories numeric(7, 1),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  external_provider public.food_provider,
  external_food_id text,
  custom_food_id uuid references public.custom_foods (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index favorites_user_idx on public.favorites (user_id, created_at desc);
create index favorites_external_idx on public.favorites (external_provider, external_food_id)
  where external_food_id is not null;
create trigger favorites_updated_at before update on public.favorites
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- saved_meals / saved_meal_items
-- ---------------------------------------------------------------------------
create table public.saved_meals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  default_meal_type public.meal_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index saved_meals_user_idx on public.saved_meals (user_id, updated_at desc);
create trigger saved_meals_updated_at before update on public.saved_meals
  for each row execute function public.set_updated_at();

create table public.saved_meal_items (
  id uuid primary key,
  saved_meal_id uuid not null references public.saved_meals (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  position smallint not null default 0,
  food_name text not null,
  brand text,
  serving_quantity numeric(8, 2),
  serving_unit text,
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  calories numeric(7, 1),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  external_provider public.food_provider,
  external_food_id text,
  custom_food_id uuid references public.custom_foods (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_meal_items_meal_idx on public.saved_meal_items (saved_meal_id, position);
create trigger saved_meal_items_updated_at before update on public.saved_meal_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- notification_preferences
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  enabled boolean not null default true,
  morning_9am boolean not null default true,
  zero_log_2pm boolean not null default true,
  zero_log_7pm boolean not null default false,
  remaining_4pm boolean not null default true,
  remaining_7pm boolean not null default true,
  zero_log_8pm boolean not null default true,
  progress_reminder boolean not null default false,
  permission_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscription_status (written only by the RevenueCat webhook via service role)
-- ---------------------------------------------------------------------------
create table public.subscription_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement text not null default 'pro',
  is_active boolean not null default false,
  period_type text,
  product_id text,
  store text,
  expires_at timestamptz,
  will_renew boolean,
  last_event_type text,
  last_event_at timestamptz,
  updated_at timestamptz not null default now()
);

create trigger subscription_status_updated_at before update on public.subscription_status
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.custom_foods enable row level security;
alter table public.ai_photo_analyses enable row level security;
alter table public.food_logs enable row level security;
alter table public.daily_overrides enable row level security;
alter table public.favorites enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_meal_items enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.subscription_status enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own custom foods" on public.custom_foods
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Analyses are created by the server; users may read and confirm their own.
create policy "read own analyses" on public.ai_photo_analyses
  for select to authenticated using (user_id = auth.uid());
create policy "update own analyses" on public.ai_photo_analyses
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own food logs" on public.food_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own daily overrides" on public.daily_overrides
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own favorites" on public.favorites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own saved meals" on public.saved_meals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own saved meal items" on public.saved_meal_items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own notification preferences" on public.notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read own subscription" on public.subscription_status
  for select to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage: private meal photos at meal-photos/{auth.uid()}/...
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('meal-photos', 'meal-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/heic'])
on conflict (id) do nothing;

create policy "upload own meal photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "read own meal photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "delete own meal photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'meal-photos' and (storage.foldername(name))[1] = auth.uid()::text);
