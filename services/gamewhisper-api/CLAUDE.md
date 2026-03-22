# gamewhisper-api

ElysiaJS backend API for Game Whisper. Deployed on Railway at `https://api.gamewhisper.io`, auto-deploys from `main`.

## Architecture

### Folder structure

```
src/
├── index.ts              # App bootstrap only — mounts routes, starts server
├── lib/
│   ├── logger.ts         # log() utility — structured JSON output
│   ├── errors.ts         # AppError class
│   └── firebase.ts       # Firebase Admin SDK init — exports db, auth (null when unconfigured)
├── middleware/
│   ├── auth.ts           # authPlugin — x-api-key for ElevenLabs tool calls
│   └── firebaseAuth.ts   # firebaseAuthPlugin — Firebase ID token for user-authenticated routes
├── wiki/                 # Feature module (one folder per domain)
│   ├── index.ts          # Elysia controller — route definitions only
│   ├── service.ts        # WikiService — abstract class, static methods
│   └── model.ts          # WikiModel — t.Object schemas (single source of truth)
└── session/              # Session persistence
    ├── index.ts          # POST /session/start, POST /session/end
    ├── service.ts        # SessionService — createSession, endSession, recordToolCall
    └── model.ts          # SessionModel — t.Object schemas
```

Add new features as new folders under `src/` following the same pattern.

### index.ts is bootstrap only

`src/index.ts` mounts route groups and starts the server. No business logic.

```ts
const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .use(wikiRoutes)
  .listen(PORT)
```

### Route files (controllers) stay lean

Route files define endpoints and schemas only — no business logic. Delegate to service classes.

```ts
// Good
export const wikiRoutes = new Elysia({ prefix: '/wiki' })
  .use(authPlugin)
  .post('/search', async ({ body }) => WikiService.search(body.game, body.query), {
    body: WikiModel.searchBody,
  })

// Bad — logic leaking into the route handler
.post('/search', async ({ body }) => {
  const fc = new FirecrawlApp(...)
  const results = await fc.search(...)
  // ...
})
```

### Services are abstract classes with static methods

Services own business logic and are independent of HTTP/Elysia. Use `abstract class` with `static` methods when there is no instance state needed (most cases).

```ts
export abstract class WikiService {
  private static fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

  static async search(game: string, query: string): Promise<string> { ... }
}
```

This pattern (from Elysia best practices) avoids unnecessary instantiation and keeps services testable and framework-agnostic.

### Models are the single source of truth

Define all `t.Object` schemas in `model.ts`. Never declare a separate TypeScript interface alongside a schema — use `typeof` / `Static` to derive types from the schema if needed.

```ts
// wiki/model.ts
export const WikiModel = {
  searchBody: t.Object({
    game: t.String(),
    query: t.String(),
    sessionId: t.Optional(t.String()),
  }),
}

// In route — reference the model, don't re-declare inline
.post('/search', handler, { body: WikiModel.searchBody })
```

### Auth plugins

Two auth plugins cover different callers:

| Plugin | File | Used by | Header |
|---|---|---|---|
| `authPlugin` | `middleware/auth.ts` | ElevenLabs tool calls | `x-api-key: <INTERNAL_API_KEY>` |
| `firebaseAuthPlugin` | `middleware/firebaseAuth.ts` | Desktop client | `Authorization: Bearer <Firebase ID token>` |

`firebaseAuthPlugin` uses `derive` to verify the token and inject `uid` into the context, then `onBeforeHandle` to reject with 401 if verification failed. Both use `{ as: 'scoped' }` so they only protect routes that explicitly `.use()` them.

```ts
// ElevenLabs tool call routes
export const wikiRoutes = new Elysia({ prefix: '/wiki' })
  .use(authPlugin)

// User-authenticated routes (desktop client)
export const sessionRoutes = new Elysia({ prefix: '/session' })
  .use(firebaseAuthPlugin) // uid available in handler context
  .post('/start', async ({ uid, body }) => { ... })
```

## Firestore Data Schema

### Client-readable: `/users/{uid}/sessions/{sessionId}`
```ts
{
  sessionId: string
  uid: string
  gameName: string
  startedAt: number      // epoch ms
  endedAt: number | null // epoch ms
  messages: [{ role: 'user'|'agent', content: string, timestamp: number }]
  toolCalls: [{ query: string, sources: string[], durationMs: number, preprocessed: boolean, recordedAt: number }]
}
```

### Server-only collections (Admin SDK only, clients blocked by security rules)
- `/_sessionIndex/{sessionId}` — `{ uid, gameName, createdAt }` — used by wiki search to map sessionId → uid
- `/_analytics/{sessionId}` — reserved for Stage 6 operational metrics

### Firestore security rules (deploy in Firebase Console)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /_sessionIndex/{document=**} {
      allow read, write: if false;
    }
    match /_analytics/{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Security

- `/wiki/search` and machine-to-machine routes require `x-api-key` header (`INTERNAL_API_KEY`)
- `/session/*` routes require Firebase ID token — uid is verified server-side, never trusted from client
- `POST /session/end` verifies session ownership via `_sessionIndex` before writing
- `_sessionIndex` and `_analytics` are admin-SDK-only; Firestore rules block all client access
- Secrets via environment variables only — never hardcode keys
- Validate all input with `t.Object` schemas on every route body, query, and param
- Return generic error messages to callers; log the real error server-side

## Error Handling

### AppError

Throw `AppError` in services with a meaningful status code. Catch in route handlers and map to HTTP responses.

```ts
// In service
throw new AppError(`Wiki search timed out`, 504, 'TIMEOUT')

// In route handler
catch (err) {
  if (err instanceof AppError && err.statusCode < 500) {
    return { result: err.message, ... }
  }
  log('error', 'unexpected error', { err: String(err) })
  return { result: 'Internal error fallback message', ... }
}
```

### Timeouts

Always race external calls against a timeout. Throw `AppError` so the route handler can catch and classify it.

```ts
const timeout = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new AppError('Timed out', 504, 'TIMEOUT')), 7_500),
)
const result = await Promise.race([externalCall(), timeout])
```

## Logging

Use `log()` from `src/lib/logger.ts`. Always log at `error` level when catching exceptions.

```ts
log('info', 'wiki/search', { game, query })
log('error', 'wiki/search failed', { err: String(err), toolCallDurationMs })
```

Output format: `{ level, ts, msg, ...data }` — JSON lines to stdout.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `INTERNAL_API_KEY` | Yes | Shared secret for ElevenLabs tool call auth |
| `FIRECRAWL_API_KEY` | Yes | Firecrawl API key |
| `FIREBASE_PROJECT_ID` | Yes (Stage 5+) | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes (Stage 5+) | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Yes (Stage 5+) | Firebase service account private key (Railway auto-escapes newlines) |
| `PORT` | No | HTTP port (default: 3000) |

## Commands

```bash
bun install       # Install deps
bun dev           # Dev server with watch
bun run start     # Production start
```
