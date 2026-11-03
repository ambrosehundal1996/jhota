-- Optional meal photo for AI-logged rows. Local file URIs stay on-device.
alter table public.food_logs
  add column if not exists photo_storage_path text;
