-- Create intake_submissions table for public leads
create table if not exists public.intake_submissions (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone text,
  dog_name text,
  notes text,
  status text default 'new' check (status in ('new', 'approved', 'archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.intake_submissions enable row level security;

-- Drop existing policies if they exist (for idempotent migrations)
drop policy if exists "Public can submit intake forms" on public.intake_submissions;
drop policy if exists "Trainers can manage submissions" on public.intake_submissions;

-- Policies

-- 1. Public INSERT (Anon users can submit forms)
create policy "Public can submit intake forms"
  on public.intake_submissions
  for insert
  with check (true);

-- 2. Trainers can VIEW/UPDATE (Authenticated users)
create policy "Trainers can manage submissions"
  on public.intake_submissions
  for all
  using (auth.role() = 'authenticated');
