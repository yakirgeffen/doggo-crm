-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Users)
-- Links to Supabase Auth.users
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  full_name text,
  role text not null check (role in ('trainer', 'assistant')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- CLIENTS
create table public.clients (
  id uuid default uuid_generate_v4() primary key,
  full_name text not null,
  email text,
  phone text,
  primary_dog_name text,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

-- PROGRAMS
create table public.programs (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.clients(id) not null,
  program_name text not null,
  program_type text not null check (program_type in ('fixed_sessions', 'open_ended')),
  sessions_included int, -- Nullable for open ended
  sessions_completed int default 0,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  assigned_trainer uuid references public.profiles(id),
  payment_status text default 'pending' check (payment_status in ('pending', 'paid')),
  greeninvoice_invoice_number text,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

alter table public.programs enable row level security;

-- SESSIONS
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  program_id uuid references public.programs(id) not null,
  session_date date not null,
  trainer uuid references public.profiles(id),
  session_notes text,
  homework text,
  next_session_date date,
  created_at timestamptz default now()
);

alter table public.sessions enable row level security;

-- EMAIL TEMPLATES
create table public.email_templates (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  subject text not null,
  body_template text not null, -- Markdown or Text with {{variables}}
  created_at timestamptz default now()
);

alter table public.email_templates enable row level security;

-- ACTIVITY LOGS (Timeline)
create table public.activity_logs (
  id uuid default uuid_generate_v4() primary key,
  entity_type text not null, -- 'client', 'program', 'session', 'email'
  entity_id uuid not null,
  action text not null, -- 'created', 'updated', 'sent'
  description text,
  performed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

-- RLS POLICIES
-- Simple policy: Trainers see everything, Assistants can see/edit most but not delete.
-- For V1 simplicity: Authenticated users can read everything.
-- Writing logic handled below.

create policy "Enable read access for all authenticated users"
on public.profiles for select using (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.clients for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.clients for insert with check (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.programs for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.programs for insert with check (auth.role() = 'authenticated');

create policy "Enable read access for all authenticated users"
on public.sessions for select using (auth.role() = 'authenticated');

create policy "Enable insert/update for all authenticated users"
on public.sessions for insert with check (auth.role() = 'authenticated');

-- FUNCTIONS & TRIGGERS

-- Auto-update sessions_completed in programs
create or replace function update_sessions_completed()
returns trigger as $$
begin
  update public.programs
  set sessions_completed = (
    select count(*) from public.sessions where program_id = new.program_id
  )
  where id = new.program_id;
  return new;
end;
$$ language plpgsql;

create trigger on_session_created
after insert on public.sessions
for each row execute procedure update_sessions_completed();

-- Auto-create profile on signup (Optional, depends on auth flow. Usually handled via Supabase triggers on auth.users)
-- Skipping for now, assuming manual invite or manual profile creation.
