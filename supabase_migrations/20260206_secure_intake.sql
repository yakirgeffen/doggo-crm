-- Add trainer_id column for multi-tenancy
-- Add captcha_token column for audit trail

alter table public.intake_submissions 
add column if not exists trainer_id uuid references auth.users(id);

alter table public.intake_submissions 
add column if not exists captcha_token text;

-- Update RLS policy to be trainer-specific
-- Drop old permissive policy
drop policy if exists "Trainers can manage submissions" on public.intake_submissions;

-- Create strict policy: trainers only see their own leads
create policy "Trainers can manage their own submissions"
  on public.intake_submissions
  for all
  using (
    auth.uid() = trainer_id 
    or trainer_id is null  -- Allow viewing "orphan" submissions (no trainer assigned)
  );

-- Public INSERT policy remains (with check for valid data)
-- Already exists from previous migration
