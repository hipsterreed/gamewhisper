import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { wikiRoutes } from './wiki'
import { sessionRoutes } from './session'

const ALLOWED_ORIGINS = [
  'https://gamewhisper.io',
  'https://www.gamewhisper.io',
  'https://demo.gamewhisper.io',
  'http://localhost:5173',
  'http://localhost:4173',
]

export const app = new Elysia()
  .use(cors({
    origin: (request) => {
      const origin = request.headers.get('origin') ?? ''
      return ALLOWED_ORIGINS.includes(origin)
    },
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  }))
  .get('/health', () => ({ status: 'gtfo' }))
  .use(wikiRoutes)
  .use(sessionRoutes)
