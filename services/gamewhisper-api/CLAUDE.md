# gamewhisper-api

ElysiaJS backend API for Game Whisper. Deployed on Railway at `https://api.gamewhisper.io`, auto-deploys from `main`.

## Architecture

### Folder structure

```
src/
├── index.ts              # App bootstrap only — mounts routes, starts server
├── lib/
│   ├── logger.ts         # log() utility — structured JSON output
│   └── errors.ts         # AppError class
├── middleware/
│   └── auth.ts           # authPlugin — named Elysia plugin for API key auth
└── wiki/                 # Feature module (one folder per domain)
    ├── index.ts          # Elysia controller — route definitions only
    ├── service.ts        # WikiService — abstract class, static methods
    └── model.ts          # WikiModel — t.Object schemas (single source of truth)
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

### Auth is a named Elysia plugin

Auth lives in `src/middleware/auth.ts` as a named plugin (`{ name: 'Auth.Plugin' }`). The `as: 'scoped'` option means the `beforeHandle` hook only applies to routes that `.use(authPlugin)` — the public `/health` route is unaffected.

```ts
export const authPlugin = new Elysia({ name: 'Auth.Plugin' })
  .onBeforeHandle({ as: 'scoped' }, ({ request, set }) => {
    if (!INTERNAL_API_KEY || request.headers.get('x-api-key') !== INTERNAL_API_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
  })
```

Apply it to any route group that requires authentication:

```ts
export const wikiRoutes = new Elysia({ prefix: '/wiki' })
  .use(authPlugin) // all routes below are protected
  .post('/search', ...)
```

## Security

- All non-health routes require `x-api-key` header validated against `INTERNAL_API_KEY`
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
| `INTERNAL_API_KEY` | Yes | Shared secret for client → API auth |
| `FIRECRAWL_API_KEY` | Yes | Firecrawl API key |
| `PORT` | No | HTTP port (default: 3000) |

## Commands

```bash
bun install       # Install deps
bun dev           # Dev server with watch
bun run start     # Production start
```
