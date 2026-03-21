# Game Whisper

## Project Structure
- `planning/` — project plans and design docs
- `apps/` — client applications (one folder per app)
- `services/` — backend API services (one folder per service)

## Stack
- **Runtime**: Bun (use `bun` for all commands, not `npm`/`node`)
- **Client**: Tauri desktop app (Windows target)
- **API**: ElysiaJS
- **Database**: Firebase
- **Hosting**: Railway — auto-deploys on push to `main`

## Commands
- Install deps: `bun install`
- Dev server: `bun dev`
- Build: `bun run build`
- Tests: `bun test`

## Code Style
- Use ES modules (`import`/`export`), never CommonJS (`require`)
- TypeScript everywhere

## Workflow
- IMPORTANT: Never push directly to `main` — Railway auto-deploys on every push to main, so only merge intentional, working changes there
- Run `bun run build` before committing to catch type errors
