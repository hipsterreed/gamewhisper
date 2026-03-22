# gamewhisper-api

ElysiaJS backend API for Game Whisper. Deployed on Railway at `https://api.gamewhisper.io`, auto-deploys from `main`.

## Structure

```
src/
├── index.ts          # Bootstrap only — mounts routes, starts server
├── lib/              # Shared utilities (logger, errors, firebase)
├── middleware/       # Auth plugins (API key + Firebase ID token)
└── <feature>/        # One folder per domain (index.ts, service.ts, model.ts)
```

## Conventions

- **Controllers** (`index.ts`) — route definitions only, delegate to services
- **Services** (`service.ts`) — abstract classes with static methods, no HTTP concerns
- **Models** (`model.ts`) — Elysia `t.Object` schemas; derive types from schemas, don't duplicate with interfaces

## Auth

Two scoped plugins (use both with `{ as: 'scoped' }`):
- `authPlugin` — `x-api-key` header, for ElevenLabs machine-to-machine calls
- `firebaseAuthPlugin` — `Authorization: Bearer <Firebase ID token>`, injects `uid` into context for user routes

## Security

- Never trust uid from the client — always verify server-side via Firebase token
- Validate all input with schemas on every route
- Secrets via env vars only, never hardcoded
- Return generic errors to callers; log the real error server-side

## Commands

```bash
bun install    # Install deps
bun dev        # Dev server with watch
bun run start  # Production start
```
