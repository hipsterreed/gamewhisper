import { Elysia } from 'elysia'

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY

export const authPlugin = new Elysia({ name: 'Auth.Plugin' }).onBeforeHandle(
  { as: 'scoped' },
  ({ request, set }) => {
    if (!INTERNAL_API_KEY || request.headers.get('x-api-key') !== INTERNAL_API_KEY) {
      set.status = 401
      return { error: 'Unauthorized' }
    }
  },
)
