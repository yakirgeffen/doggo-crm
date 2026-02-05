-- Add pricing columns to programs
alter table public.programs 
add column if not exists price numeric default null,
add column if not exists currency text default 'ILS';

-- Add pricing and linkage columns to sessions
alter table public.sessions 
add column if not exists price numeric default null,
add column if not exists currency text default 'ILS',
add column if not exists service_id uuid references public.services(id);
