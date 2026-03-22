import { Elysia } from 'elysia'
import { wikiRoutes } from './wiki'
import { sessionRoutes } from './session'

export const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .use(wikiRoutes)
  .use(sessionRoutes)
