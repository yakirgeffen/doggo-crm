-- Secure intake_submissions by removing public access
-- The Edge Function will use the Service Role key to insert submissions

-- 1. Drop the public insert policy
drop policy if exists "Public can submit intake forms" on public.intake_submissions;

-- 2. Ensure RLS is enabled (it should be, but just in case)
alter table public.intake_submissions enable row level security;

-- 3. (Optional) Explicitly allow Service Role (it's allowed by default, but good for docs)
-- No policy needed for service_role as it bypasses RLS.

-- 4. Ensure Trainers can still view/manage their own submissions (from previous migration)
-- This confirms the policy exists:
-- create policy "Trainers can manage their own submissions" ...
