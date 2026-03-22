import { t } from 'elysia'

export const WikiModel = {
  searchBody: t.Object({
    game: t.String(),
    query: t.String(),
    topic: t.Optional(t.String()),
    sessionId: t.Optional(t.String()),
  }),
}
