-- Create a table for services
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  price numeric not null default 0,
  currency text default 'ILS',
  duration_minutes integer default 60,
  color text default '#15803d', -- Default to brand primary
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.services enable row level security;

-- Create policies
create policy "Users can view their own services"
  on public.services for select
  using ( auth.uid() = user_id );

create policy "Users can manage their own services"
  on public.services for all
  using ( auth.uid() = user_id );

-- Create trigger to handle updated_at
create trigger handle_services_updated_at
  before update on public.services
  for each row
  execute procedure public.handle_updated_at();
