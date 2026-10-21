alter table public.notification_preferences
  add column if not exists morning_9am boolean not null default true,
  add column if not exists zero_log_8pm boolean not null default true;
