# Doggo CRM — Claude Guide

A CRM built for dog trainers. Manages clients, their dogs, training programs, sessions, and scheduling. Includes a public-facing storefront and intake form per trainer, with full Hebrew RTL UI.

## Philosophy

- **Simplicity over sophistication** — no state management libraries, no form libraries, no HTTP clients. One dependency for one job.
- **TypeScript strict mode is the test suite** — there are no automated tests. `npm run build` is the correctness check.
- **Hebrew-first** — all UI copy is in Hebrew. RTL is a first-class concern, not an afterthought.
- **Security through the database** — RLS enforces data isolation per trainer. Don't replicate that logic in the application layer.
- **Audit everything** — every data mutation should produce an `activity_logs` row via `logActivity()`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript 5.9, Tailwind CSS 4 |
| Icons | lucide-react (only — do not add other icon libraries) |
| Routing | React Router DOM 7 |
| Build | Vite 7 |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) |
| Edge Functions | Deno (in `supabase/functions/`) |
| Email | Resend API |
| CAPTCHA | Cloudflare Turnstile |
| Deployment | Vercel |

## Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Type-check (tsc -b) then build for production
npm run lint     # Run ESLint across the project
npm run preview  # Preview production build locally
```

**There are no automated tests.** TypeScript strict-mode compilation (`npm run build`) is the primary correctness check.

## Environment Variables

Create a `.env` file at the project root (never commit it):

```
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_anon_key>
VITE_TURNSTILE_SITE_KEY=<your_turnstile_site_key>   # optional, has a test fallback
```

## Project Structure

```
src/
  App.tsx                  # All route definitions (React Router)
  main.tsx                 # React entry point
  index.css                # Tailwind theme (RTL-aware color palette)
  pages/                   # One file per route
    public/                # Unauthenticated public routes
  components/              # Reusable UI components
    admin/                 # Admin-specific components
    client/                # Client detail view components
    dashboard/             # Dashboard widgets
    settings/              # Settings tab panels
  context/
    AuthContext.tsx         # Supabase auth state + useAuth() hook
    ToastContext.tsx        # Global toast notification system
  hooks/
    useDashboard.ts        # Dashboard KPIs and action items
    useServices.ts         # Services catalog
    useSettings.ts         # Trainer settings
    useIntegrations.ts     # External integrations (Google)
  lib/
    supabase.ts            # Supabase client + helper functions (logActivity, updateProgramStatus)
    calendar.ts            # Google Calendar integration
    gmail.ts               # Gmail integration
  types/
    index.ts               # Core domain types
    dashboard.ts           # Dashboard-specific types
  utils/
    seedHebrew.ts          # Dev seed data in Hebrew
supabase/
  functions/               # Deno edge functions
    morning-api/
    process-intake/        # Intake form handler (email via Resend, CAPTCHA validation)
  migrations/              # Supabase migration SQL files
supabase_schema.sql        # Full database schema with RLS policies and triggers
```

## Architecture & Conventions

### State Management
- **Global state**: React Context API only (`AuthContext`, `ToastContext`). No Redux/Zustand.
- **Server state**: Custom hooks (`useDashboard`, `useServices`, etc.) using `useState` + `useEffect`.
- **Local state**: `useState` inside page/component files.

### Data Access
All database access goes through the Supabase client in `src/lib/supabase.ts`. Row Level Security (RLS) is enabled on all tables — queries are automatically scoped to the authenticated trainer.

Helper functions to use for side effects:
- `logActivity(table, id, action, details)` — writes to `activity_logs`; call this after every successful mutation
- `updateProgramStatus(programId, status)` — handles program status transitions; use this instead of updating the `status` column directly

### Notifications
Use the `useToast()` hook for all user-facing feedback. Never use `alert()`.

```tsx
const { showToast } = useToast();
showToast('הפעולה הצליחה', 'success');  // 'success' | 'error' | 'info'
```

Toast auto-dismisses after 3500ms. The `ToastContext` is provided at the app root.

### Routing

**Authenticated routes** (wrapped in `<RequireAuth>`):
- `/` → Dashboard
- `/clients`, `/clients/:id`, `/clients/new` — client management
- `/programs`, `/programs/:id`, `/programs/new` — training programs
- `/programs/:programId/sessions/new` — new session creation
- `/calendar` — scheduling
- `/settings` — trainer profile/preferences
- `/storefront` — storefront admin panel
- `/seed` — dev-only data seeding

**Public routes** (no auth):
- `/t/:trainerHandle` — public storefront
- `/t/:trainerHandle/intake` — public lead intake form
- `/login` — auth page
- `/welcome`, `/privacy`, `/terms` — static public pages

### Component Patterns

- **Page components** own data fetching and pass data down as props.
- **Feature components** are grouped by domain in subdirectories.
- **Modal components** are standalone files (`BookSessionModal.tsx`, `QuickAddClientModal.tsx`, etc.).
- **Conditional classes** use template literals with ternary expressions — `clsx` is not used.

  ```tsx
  className={`base-class ${condition ? 'class-a' : 'class-b'}`}
  ```

#### Modal Lifecycle Pattern
Every modal that performs an async mutation should follow this pattern:

1. Track loading state with a `saving` (or `loading`) boolean.
2. Disable the submit button and show a spinner or in-button text ("שומר...") while saving.
3. On success: call `showToast()`, then the parent callback (e.g. `onSaved()`), then `onClose()`.
4. On error: call `showToast(..., 'error')` and keep the modal open.

```tsx
const [saving, setSaving] = useState(false);

async function handleSubmit() {
  setSaving(true);
  try {
    await supabase.from('...').insert({...});
    await logActivity('...', id, 'created', '...');
    showToast('נשמר בהצלחה', 'success');
    onSaved();
    onClose();
  } catch (err) {
    showToast('שגיאה בשמירה', 'error');
  } finally {
    setSaving(false);
  }
}

// In JSX:
<button disabled={saving || !requiredField} onClick={handleSubmit}>
  {saving ? 'שומר...' : 'שמור'}
</button>
```

### TypeScript
Strict mode is enabled. Key flags: `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Build will fail on type errors.

Core domain types (`src/types/index.ts`):
- `Client`, `Program`, `Session`, `TrainerProfile`, `Service`, `UserSettings`
- Join types: `ProgramWithClient`, `SessionWithProgram`

### Styling
Tailwind CSS 4 with a custom RTL-aware theme defined in `src/index.css` and `tailwind.config.js`.

Color palette:
- Primary: Moss Green `#4A6741`
- Accent: Terracotta `#C4785C`
- Success `#5A7D58` / Warning `#D4A853` / Error `#B85C5C`

The entire UI is Hebrew RTL (`dir="rtl"` on `<html>`). Prefer Tailwind's `start`/`end` logical properties over `left`/`right`.

### Database (Supabase / PostgreSQL)
Key tables: `profiles`, `clients`, `programs`, `sessions`, `services`, `user_settings`, `email_templates`, `activity_logs`, `intake_submissions`.

- All tables have RLS enabled — always query as an authenticated user in tests/seeds.
- `sessions_completed` on programs is updated automatically via a DB trigger.
- `trainer_handle` on `user_settings` drives the public storefront URL.
- `supabase_schema.sql` is the source of truth for table/column names and RLS policies — check it before writing queries.

### Security
- `.env` is gitignored — never commit secrets.
- RLS enforces data isolation per trainer at the database level.
- Turnstile CAPTCHA on the public intake form.
- Google OAuth scopes limited to Gmail and Calendar — do not expand them without deliberate review.

## Do Not

- **No `alert()`** — use `showToast()` from `useToast()` instead.
- **No `window.location.href` for in-app navigation** — use React Router's `navigate()`.
- **No `window.location.reload()`** — refetch data via state or re-render instead.
- **No new state management libraries** — React Context + `useState` is the pattern.
- **No new icon libraries** — `lucide-react` only.
- **No form libraries** (React Hook Form, Formik, etc.) — controlled `useState` inputs only.
- **No HTTP client libraries** (axios, etc.) — Supabase client and native `fetch` only.
- **No `date-fns`** — it's installed but unused; use native `Date` and `toLocaleDateString()` instead.
- **Don't update `programs.status` directly** — always use `updateProgramStatus()` from `src/lib/supabase.ts`.
- **Don't skip `logActivity()`** after mutations — every write to the DB should produce an audit log row.

## Common Tasks

**Add a new page**: Create `src/pages/MyPage.tsx`, add a `<Route>` in `src/App.tsx`, wrap with `<RequireAuth>` if it needs authentication.

**Add a new DB query**: Use the Supabase client from `src/lib/supabase.ts`. Check `supabase_schema.sql` for table/column names and RLS policies.

**Add a new mutation (insert/update/delete)**:
1. Run the Supabase query.
2. Call `logActivity(table, recordId, action, details)` on success.
3. Call `showToast()` with a success or error message.
4. Disable the triggering button while the request is in flight.

**Add a new edge function**: Create a directory under `supabase/functions/`, use Deno APIs. Deploy via `supabase functions deploy <name>`.

**Lint before committing**:
```bash
npm run lint
npm run build   # also runs tsc type-check
```

## Known Tech Debt

- **`alert()` in `QuickAddClientModal.tsx:43`** — should be replaced with `showToast()`.
- **`window.location.reload()` in `EmailComposer.tsx`** — should refetch data via state instead.
- **Intake tab in `ClientDetailPage`** — placeholder, marked Phase 3. Do not build on it yet.
- **Email templates in `EmailComposer`** — 3 templates are hardcoded in the component; they are not loaded from the `email_templates` DB table yet.
- **`date-fns` and `clsx`** — both are installed in `package.json` but unused. Do not start using them without a plan to use them consistently.
- **`logActivity()` coverage is incomplete** — it is currently only called in `EmailComposer`. All other mutations are missing audit log calls.
