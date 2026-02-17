-- Enforce cascading deletes to ensure data integrity
-- When a parent record is deleted, all related child records should be deleted automatically.

-- 1. Clients -> Auth Users
alter table public.clients 
drop constraint if exists clients_user_id_fkey,
add constraint clients_user_id_fkey 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade;

-- 2. User Settings -> Auth Users
alter table public.user_settings
drop constraint if exists user_settings_user_id_fkey,
add constraint user_settings_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

-- 3. Programs -> Auth Users
alter table public.programs
drop constraint if exists programs_user_id_fkey,
add constraint programs_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

-- 4. Sessions -> Auth Users
alter table public.sessions
drop constraint if exists sessions_user_id_fkey,
add constraint sessions_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

-- 5. Services -> Auth Users
alter table public.services
drop constraint if exists services_user_id_fkey,
add constraint services_user_id_fkey
    foreign key (user_id)
    references auth.users(id)
    on delete cascade;

-- 6. Programs -> Clients (If client is deleted, delete their programs)
alter table public.programs
drop constraint if exists programs_client_id_fkey,
add constraint programs_client_id_fkey
    foreign key (client_id)
    references public.clients(id)
    on delete cascade;

-- 7. Sessions -> Clients (If client is deleted, delete their sessions)
alter table public.sessions
drop constraint if exists sessions_client_id_fkey,
add constraint sessions_client_id_fkey
    foreign key (client_id)
    references public.clients(id)
    on delete cascade;

-- 8. Sessions -> Programs (If program is deleted, delete its sessions)
alter table public.sessions
drop constraint if exists sessions_program_id_fkey,
add constraint sessions_program_id_fkey
    foreign key (program_id)
    references public.programs(id)
    on delete cascade;

-- 9. Intake Submissions -> Trainers (If trainer exists)
-- Note: Intake might reference auth.users via trainer_id.
-- We check if constraint exists first, usually it's auto-named.
-- Since we added it in migration 20260206 without naming it explicitly, 
-- we need to find it or just add a new one if we can drop the old one.
-- A safe way is to alter the column to add ON DELETE CASCADE if possible, 
-- but identifying the constraint name is better.
-- Assuming standard naming "intake_submissions_trainer_id_fkey".

do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'intake_submissions_trainer_id_fkey') then
    alter table public.intake_submissions drop constraint intake_submissions_trainer_id_fkey;
  end if;
end $$;

alter table public.intake_submissions
add constraint intake_submissions_trainer_id_fkey
    foreign key (trainer_id)
    references auth.users(id)
    on delete cascade;

-- 10. Services -> Intake Submissions (If service is deleted, keep submission but nullify service)
-- (Actually, we usually软 delete services, but if hard deleted, set to null)
do $$
begin
  if exists (select 1 from information_schema.table_constraints where constraint_name = 'intake_submissions_selected_service_id_fkey') then
    alter table public.intake_submissions drop constraint intake_submissions_selected_service_id_fkey;
  end if;
end $$;

alter table public.intake_submissions
add constraint intake_submissions_selected_service_id_fkey
    foreign key (selected_service_id)
    references public.services(id)
    on delete set null;
