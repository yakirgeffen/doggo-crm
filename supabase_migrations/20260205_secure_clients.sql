-- Secure Clients, Programs, and Sessions
-- 1. Add user_id column with default to current user
alter table public.clients 
add column if not exists user_id uuid references auth.users(id) default auth.uid();

alter table public.programs 
add column if not exists user_id uuid references auth.users(id) default auth.uid();

alter table public.sessions 
add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- 2. Drop Insecure Policies (Allowing generic 'authenticated' access)
drop policy if exists "Enable read access for all authenticated users" on public.clients;
drop policy if exists "Enable insert/update for all authenticated users" on public.clients;

drop policy if exists "Enable read access for all authenticated users" on public.programs;
drop policy if exists "Enable insert/update for all authenticated users" on public.programs;

drop policy if exists "Enable read access for all authenticated users" on public.sessions;
drop policy if exists "Enable insert/update for all authenticated users" on public.sessions;

-- 3. Create Strict + Legacy Policies
-- Strategy:
-- - You can SEE/EDIT your own rows (user_id = auth.uid())
-- - You can SEE legacy rows (user_id IS NULL) - Transition period
-- - New rows automatically get user_id via default

-- CLIENTS
create policy "Users can manage their own clients"
on public.clients
for all
using ( auth.uid() = user_id or user_id is null )
with check ( auth.uid() = user_id ); 

-- PROGRAMS
create policy "Users can manage their own programs"
on public.programs
for all
using ( auth.uid() = user_id or user_id is null )
with check ( auth.uid() = user_id );

-- SESSIONS
create policy "Users can manage their own sessions"
on public.sessions
for all
using ( auth.uid() = user_id or user_id is null )
with check ( auth.uid() = user_id );

-- 4. Helper Function to "Adopt" Orphans
-- Running this will claim all orphan rows for the current user.
-- Usage: select adopt_orphans();
create or replace function adopt_orphans()
returns void as $$
begin
  update public.clients set user_id = auth.uid() where user_id is null;
  update public.programs set user_id = auth.uid() where user_id is null;
  update public.sessions set user_id = auth.uid() where user_id is null;
end;
$$ language plpgsql security invoker;
