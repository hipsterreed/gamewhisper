# Game Whisper

## Project Structure
- `planning/` — project plans and design docs
  - `roadmap.md` — living progress checklist; check off items as they are verified working
- `apps/gamewhisper-desktop/` — Tauri + React desktop client (Windows)
- `services/gamewhisper-api/` — ElysiaJS backend API

## Roadmap Workflow
`planning/roadmap.md` is the source of truth for what has been built and verified. When a feature or acceptance criterion is confirmed working, update the roadmap by checking off the relevant item (`- [ ]` → `- [x]`). Do this as part of the same work session — don't leave checkboxes stale.

## Stack
- **Runtime**: Bun (use `bun` for all commands, not `npm`/`node`)
- **Client**: Tauri + React (Vite), TypeScript — Windows target
- **API**: ElysiaJS
- **Database**: Firebase
- **Hosting**: Railway — auto-deploys on push to `main`

## Commands

### Desktop app (`apps/gamewhisper-desktop/`)
- Install deps: `bun install`
- Web dev server: `bun dev`
- Tauri dev (desktop): `bun run desktop`
- Build web: `bun run build`
- Build desktop: `bun run desktop:build`
- Lint: `bun run lint`

### API (`services/gamewhisper-api/`)
- Install deps: `bun install`
- Dev server (watch): `bun dev`

## Code Style
- Use ES modules (`import`/`export`), never CommonJS (`require`)
- TypeScript everywhere

## Workflow
- IMPORTANT: Never push directly to `main` — Railway auto-deploys on every push to main, so only merge intentional, working changes there
- Run `bun run build` before committing to catch type errors
