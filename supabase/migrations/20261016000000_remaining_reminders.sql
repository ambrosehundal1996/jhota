alter table public.notification_preferences
  add column if not exists remaining_4pm boolean not null default true,
  add column if not exists remaining_7pm boolean not null default true;
