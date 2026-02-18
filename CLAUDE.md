# Doggo CRM — Claude Guide

A CRM built for dog trainers. Manages clients, their dogs, training programs, sessions, and scheduling. Includes a public-facing storefront and intake form per trainer, with full Hebrew RTL UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19, TypeScript 5.9, Tailwind CSS 4 |
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
- `logActivity(table, id, action, details)` — audit trail
- `updateProgramStatus(programId, status)` — handles program status transitions

### Routing
- `/` → Dashboard (requires auth, via `<RequireAuth>`)
- `/clients`, `/clients/:id`, `/clients/new` — client management
- `/programs`, `/programs/:id`, `/programs/new` — training programs
- `/sessions/new` — new session creation
- `/calendar` — scheduling
- `/settings` — trainer profile/preferences
- `/admin/storefront` — public storefront admin
- `/t/:trainerHandle` — public storefront (no auth)
- `/t/:trainerHandle/intake` — public lead intake form (no auth)
- `/login` — auth page
- `/seed` — dev-only data seeding

### Component Patterns
- **Page components** own data fetching and pass data down as props.
- **Feature components** are grouped by domain in subdirectories.
- **Modal components** are standalone files (`BookSessionModal.tsx`, `QuickAddClientModal.tsx`, etc.).
- Use `clsx` for conditional class composition.

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

### Security
- `.env` is gitignored — never commit secrets.
- RLS enforces data isolation per trainer at the database level.
- Turnstile CAPTCHA on the public intake form.
- Google OAuth scopes limited to Gmail and Calendar.

## Common Tasks

**Add a new page**: Create `src/pages/MyPage.tsx`, add a `<Route>` in `src/App.tsx`, wrap with `<RequireAuth>` if it needs authentication.

**Add a new DB query**: Use the Supabase client from `src/lib/supabase.ts`. Check `supabase_schema.sql` for table/column names and RLS policies.

**Add a new edge function**: Create a directory under `supabase/functions/`, use Deno APIs. Deploy via `supabase functions deploy <name>`.

**Lint before committing**:
```bash
npm run lint
npm run build   # also runs tsc type-check
```
