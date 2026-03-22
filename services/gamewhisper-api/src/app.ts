import { Elysia } from 'elysia'
import { wikiRoutes } from './wiki'

export const app = new Elysia()
  .get('/health', () => ({ status: 'ok' }))
  .use(wikiRoutes)
