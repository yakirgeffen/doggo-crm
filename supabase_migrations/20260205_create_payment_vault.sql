-- Create a secure vault for integration keys
create table if not exists public.sys_integrations_vault (
  user_id uuid references auth.users not null primary key,
  service_name text not null default 'morning',
  access_key_id text,
  secret_access_key text, -- In a real prod env, this should be encrypted by pgsodium or similar
  webhook_secret text,
  is_connected boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.sys_integrations_vault enable row level security;

-- POLICY: Authenticated users can INSERT/UPDATE their own keys (Write Only-ish logic handled by UI, but DB allows read for check)
-- Actually, strict security means we should DENY SELECT for 'authenticated' if we want it truly write-only.
-- But we need to know IF a key exists to show "Connected" status.
-- Compromise: Allow SELECT but we will instruct UI to never display the secret column.
-- Stronger Security: Create a separate view or only allow selecting 'is_connected'.
-- For now, standard RLS:
create policy "Users can manage their own integration keys"
  on public.sys_integrations_vault
  using ( auth.uid() = user_id );

-- Update Programs table with payment fields
alter table public.programs
add column if not exists payment_status text default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
add column if not exists payment_link_id text,
add column if not exists invoice_url text,
add column if not exists invoice_pdf_url text;

-- Update Sessions table (for pay-per-session)
alter table public.sessions
add column if not exists payment_status text default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
add column if not exists payment_link_id text,
add column if not exists invoice_url text;
