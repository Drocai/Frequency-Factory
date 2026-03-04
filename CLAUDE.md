# CLAUDE.md — Frequency Factory

Gamified music prediction platform ("stock market for music"). Users ("Factory Workers") predict which tracks become hits, earning Frequency Tokens (FT) for accurate predictions. Built as a full-stack TypeScript monorepo.

## Quick Reference

```bash
pnpm dev          # Dev server with hot reload (tsx watch)
pnpm build        # Build frontend (Vite) + backend (esbuild) → dist/
pnpm start        # Production server (node dist/index.js)
pnpm check        # TypeScript type checking (tsc --noEmit)
pnpm format       # Prettier formatting
pnpm test         # Run tests (vitest run)
pnpm db:push      # Generate + run Drizzle migrations
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.9 + Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui (New York style) |
| Routing | Wouter 3.3 (patched) |
| API | tRPC 11 (type-safe RPC) + React Query 5 |
| Backend | Node.js + Express 4 |
| ORM | Drizzle ORM 0.44 (MySQL dialect) |
| Database | MySQL (auth/users via Drizzle) + PostgreSQL (app data via Supabase) |
| Storage | AWS S3 (audio, artwork uploads) |
| AI | Anthropic Claude (QUENCY chatbot personality) |
| Audio | WaveSurfer.js + YouTube/Spotify/SoundCloud embeds |
| Testing | Vitest 2.1 |
| Package Manager | pnpm 10 |

## Project Structure

```
client/                      # React frontend
  src/
    pages/                   # Route pages (Landing, Feed, Discover, Submit, Profile, etc.)
    components/              # App-specific components
    components/ui/           # shadcn/ui primitives (DO NOT hand-edit — use shadcn CLI)
    lib/
      trpc.ts                # tRPC client setup
      supabase.ts            # Supabase client (credentials here)
      utils.ts               # cn() helper and utilities
    hooks/                   # Custom React hooks (useMobile, useComposition, etc.)
    contexts/                # React context providers (ThemeContext)
    _core/                   # Framework hooks (useAuth) — DO NOT EDIT
    App.tsx                  # Router (Wouter Switch) + providers
    main.tsx                 # Entry point
    const.ts                 # Client-side constants
    index.css                # Global styles (Tailwind directives)
  public/assets/             # Static images, avatars, logos

server/                      # Node.js backend
  _core/                     # Framework code — DO NOT EDIT (Manus platform)
  routers.ts                 # All tRPC routers (12 nested routers)
  db.ts                      # Database query layer (all SQL goes here)
  storage.ts                 # S3 file upload handler
  *.test.ts                  # Test files

drizzle/                     # Drizzle ORM
  schema.ts                  # MySQL table definitions (7 tables)
  migrations/                # Generated SQL migrations

migrations/                  # Supabase custom SQL migrations
shared/                      # Isomorphic code shared between client & server
  const.ts                   # COOKIE_NAME, UNAUTHED_ERR_MSG
  types.ts                   # Re-exports from drizzle schema
patches/                     # pnpm patches (wouter routing fix)
```

## Architecture

### tRPC Type-Safe API

All API communication uses tRPC with three procedure types:
- `publicProcedure` — no auth required (e.g., fetching submissions list)
- `protectedProcedure` — requires authenticated user (e.g., creating predictions)
- Admin routes use `protectedProcedure` + explicit `ctx.user.role !== 'admin'` check

All inputs validated with Zod schemas. The 12 tRPC routers in `server/routers.ts`:

| Router | Purpose |
|--------|---------|
| `auth` | Login/logout, session check |
| `user` | Profile, avatar updates |
| `tokens` | Balance, award, spend, daily bonus, streaks |
| `founder` | Founding Artist status (first 100 users) |
| `submissions` | Track submission CRUD, queue management |
| `predictions` | Create/check predictions (Factory Metrics) |
| `comments` | Create/list comments on tracks |
| `likes` | Toggle likes on tracks |
| `leaderboard` | Top predictors, earners, tracks, commenters |
| `notifications` | List, read, mark-read notifications |
| `admin` | Dashboard stats, user/submission management |
| `system` | Framework system router (DO NOT MODIFY) |

### Hybrid Database

**MySQL (via Drizzle ORM)** — user authentication and all relational data:
- `users` — auth, profile, token balance, avatar, founder status, streaks
- `tokenTransactions` — all earn/spend events with type enum and balance tracking
- `submissions` — track submissions with status, queue position, Factory Metrics averages
- `predictions` — user certifications with hookStrength, originality, productionQuality, vibe
- `comments` — track comments with denormalized userName/userAvatar
- `likes` — user-submission like toggles
- `notifications` — typed notifications with read status

**Supabase (PostgreSQL)** — used for real-time subscriptions on app data.

### Data Flow Pattern

```
Client → tRPC hook → tRPC router (server/routers.ts) → db function (server/db.ts) → Drizzle ORM → MySQL
```

All database queries **must** go through `server/db.ts`. Routers call `db.*` functions — never import Drizzle tables directly into routers.

### Token Economy

| Action | Tokens |
|--------|--------|
| Signup bonus | +50 FT |
| Submit track | +1 FT |
| Make prediction | +5 FT |
| 17-second engagement bonus | +2 FT |
| Post comment | +1 FT |
| Daily login | +1 FT |
| Referral | +10 FT |
| Skip queue | -10 FT |

All transactions logged in `tokenTransactions` table with type, amount, description, and `balanceAfter`.

### Client-Side Routing

Wouter `<Switch>` in `App.tsx`. Key routes:

| Path | Page | Auth |
|------|------|------|
| `/` | Landing | No |
| `/listen` | Listen (main player) | No |
| `/feed` | Feed | No |
| `/discover` | Discover tracks | No |
| `/submit` | Track submission | Yes |
| `/profile` | User profile | Yes |
| `/rewards` | Leaderboard | No |
| `/avatar` | Avatar selection | Yes |
| `/monitor` | Factory Monitor (queue) | No |
| `/dashboard` | Artist Dashboard | Yes |
| `/receipts` | Receipts Wall | No |
| `/admin` | Admin Dashboard | Admin |
| `/admin/queue` | Admin Queue | Admin |
| `/overlay` | YouTube/OBS Live Overlay | No |

## Critical Rules

1. **NEVER edit `server/_core/` or `client/src/_core/`** — these are Manus platform framework files. Modifications will be overwritten or cause breakage.
2. **All DB queries go in `server/db.ts`** — routers call `db.*` functions, never access tables directly.
3. **All tRPC inputs use Zod validation** — every mutation and query with parameters must have `.input(z.object({...}))`.
4. **Admin authorization is manual** — admin routes use `protectedProcedure` then check `ctx.user.role !== 'admin'` at the top. There is no `adminProcedure` middleware.
5. **Token transactions must be logged** — every earn/spend goes through `db.awardTokens()` or `db.spendTokens()` which record in `tokenTransactions`.
6. **shadcn/ui components in `components/ui/`** — add new ones via the shadcn CLI, don't hand-write them.

## Code Conventions

### Formatting (Prettier)

- 80 char print width
- 2-space indent, no tabs
- Semicolons: yes
- Quotes: double (including JSX)
- Trailing commas: ES5
- Arrow parens: avoid (`x => x` not `(x) => x`)
- Bracket same line: no
- End of line: LF

### Naming

- **PascalCase** for React components and page files (`PredictionModal.tsx`, `Landing.tsx`)
- **camelCase** for utilities, hooks, and non-component files (`utils.ts`, `supabase.ts`)
- **camelCase** for variables, functions, tRPC router keys
- **UPPER_SNAKE_CASE** for constants (`COOKIE_NAME`, `UNAUTHED_ERR_MSG`)

### TypeScript

- Strict mode enabled
- Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`
- Module: ESNext with bundler resolution
- Types derived from Drizzle schema: `typeof users.$inferSelect` (select type), `typeof users.$inferInsert` (insert type)
- Shared types exported from `shared/types.ts` which re-exports from `drizzle/schema.ts`

### React Patterns

- Functional components only (no class components)
- React Hook Form + Zod for form handling
- Framer Motion for animations
- `cn()` utility from `@/lib/utils` for conditional class merging (clsx + tailwind-merge)
- Sonner for toast notifications (`toast.success()`, `toast.error()`)
- Lucide React for icons

## Testing

- **Framework:** Vitest with Node.js environment
- **Location:** `server/*.test.ts`
- **Run:** `pnpm test`
- **Patterns:** `vi.mock()` for module mocking, `vi.mocked()` for typed mock access, standard `describe/it/expect`
- **Coverage:** Admin operations, auth flows, daily bonus calculations, streak detection, social sharing URLs, streaming utilities, token transactions

## Environment Variables

Managed by the Manus platform — **no `.env` files in repo**. Key variables auto-injected at runtime:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | JWT signing key |
| `OAUTH_SERVER_URL` | Manus OAuth server |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth portal (client-side) |
| `VITE_APP_ID` | Application identifier |
| `ANTHROPIC_API_KEY` | Claude API for QUENCY chatbot |

Supabase credentials are in `client/src/lib/supabase.ts` (URL + anon key).

## File Upload (S3)

`server/storage.ts` handles presigned URL generation for S3 uploads. Used for track audio files and artwork. The upload flow:
1. Client requests presigned URL via tRPC
2. Client uploads directly to S3
3. S3 URL stored in submission record
