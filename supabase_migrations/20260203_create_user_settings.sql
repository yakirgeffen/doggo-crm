-- Create a table for user settings if it doesn't exist
create table if not exists public.user_settings (
  user_id uuid references auth.users not null primary key,
  business_name text,
  work_days integer[] default '{0,1,2,3,4}', -- Default Sun-Thu
  work_hours_start text default '09:00',
  work_hours_end text default '17:00',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.user_settings enable row level security;

-- Create policies
create policy "Users can view their own settings"
  on public.user_settings for select
  using ( auth.uid() = user_id );

create policy "Users can update their own settings"
  on public.user_settings for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check ( auth.uid() = user_id );

-- Create trigger to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_settings_updated_at
  before update on public.user_settings
  for each row
  execute procedure public.handle_updated_at();
