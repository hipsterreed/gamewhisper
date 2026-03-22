import { t } from 'elysia'

const MessageSchema = t.Object({
  role: t.Union([t.Literal('user'), t.Literal('agent')]),
  content: t.String(),
  timestamp: t.Number(),
})

export const SessionModel = {
  startBody: t.Object({
    sessionId: t.String(),
    gameName: t.String(),
  }),
  endBody: t.Object({
    sessionId: t.String(),
    messages: t.Array(MessageSchema),
  }),
}
