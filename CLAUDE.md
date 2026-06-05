# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Interpaper** is a book library and portfolio platform built with:
- **Frontend**: Next.js 16.2.6 (App Router), React 19.2.4, TypeScript, Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL + Auth)
- **Deployment**: Vercel
- **UI Framework**: Supernova design system (see `.cursor/rules/ui-design.mdc`)

## Architecture

### Core Structure

```
web/src/
├── app/              # Next.js App Router
│   ├── page.tsx           # Landing page (author intro)
│   ├── library/page.tsx    # Main library view
│   ├── admin/             # Admin dashboard (protected routes)
│   ├── auth/              # Auth flows (login, signup, password reset)
│   └── books/[id]/page.tsx # Individual book detail page
├── components/       # React components
├── lib/              # Utilities and core logic
│   ├── supabase/     # Supabase client, server, admin
│   ├── auth.ts       # Authentication helpers
│   ├── comments.ts   # Comment operations
│   ├── notifications.ts
│   ├── types.ts      # TypeScript types
│   └── smoothScroll.ts
└── app/actions/      # Server actions (mutations, etc.)
```

### Key Modules

**Supabase Integration** (`web/src/lib/supabase/`)
- `client.ts`: Browser client (auth, public queries)
- `server.ts`: Server-side client (middleware, protected routes)
- `admin.ts`: Admin client (bypasses RLS for admin operations)

**Authentication** (`web/src/lib/auth.ts`, `web/src/app/auth/`)
- Login, signup, password reset flows
- Callback route for OAuth
- Session management via Supabase Auth

**Feature Areas**
- **Books**: CRUD operations, displayed in Coverflow carousel
- **Comments/Discussion**: Thread-based comments on books
- **Members**: User management in admin panel
- **Notifications**: Real-time notifications for admin actions

### Routing & Pages

- `/` → Landing page (author intro)
- `/library` → Main book library view
- `/books/[id]` → Book detail (discussion, reviews)
- `/admin/*` → Protected admin routes (books, members, comments, notifications)
- `/auth/*` → Auth flows (login, signup, forgot-password, reset-password)
- `/library2_test` → WIP library redesign test

## Development

### Setup

```bash
cd web
npm install
```

### Commands

**Local Development**
```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Environment

Create `.env.local` with Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

See `.env.local.example` for all required variables.

## Important Notes

### Next.js 16 Breaking Changes

This project uses Next.js 16.2.6, which has significant differences from older versions:
- App Router is mandatory (no Pages Router)
- Layouts and middleware patterns differ
- Server/client component boundaries are strict
- Refer to `node_modules/next/dist/docs/` for accurate API docs

### UI/UX Guidelines

All UI work must follow the **Supernova design system**:
- **Design Rules**: `.cursor/rules/ui-design.mdc` (auto-loaded in Cursor IDE)
- **Configured in Claude**: `.claude/settings.json` (claudeMd field, auto-loaded in Claude CLI)
- Key principles:
  - Double-Bezel styling (subtle borders + shadows for depth)
  - Glassmorphism (backdrop-blur + white/10 overlay)
  - Pretendard font for Korean text
  - Smooth Spring-physics hover animations (scale, shadow)
  - High-end dark mode or warm-white tones only
  - No primary colors; 1–2 subtle accent colors max

### Authentication

- Uses Supabase Auth (email/password + OAuth)
- Server-side auth via `getSession()` in `lib/auth.ts`
- Protected admin routes check session in middleware
- OAuth callback at `/auth/callback`

### Supernet to Vercel Deployment

- `next.config.ts` is minimal; Vercel provides defaults
- Environment variables are set in Vercel project settings
- Deploy via git push to main branch
