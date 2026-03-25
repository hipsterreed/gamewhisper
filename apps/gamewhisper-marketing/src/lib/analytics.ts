import mixpanel from 'mixpanel-browser'

const TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined

let initialized = false

export function initAnalytics() {
  if (!TOKEN || initialized) return
  mixpanel.init(TOKEN, { persistence: 'localStorage', ignore_dnt: false })
  initialized = true
}

function track(event: string, props?: Record<string, unknown>) {
  if (!initialized) return
  mixpanel.track(event, props)
}

export const analytics = {
  pageViewed() {
    track('page_viewed')
  },

  ctaClicked(location: 'hero' | 'final_cta') {
    track('cta_clicked', { location })
  },

  gameSelected(game: string) {
    track('game_selected', { game })
  },

  sessionStarted(game: string) {
    track('session_started', { game })
  },

  queryMade(game: string, messageIndex: number) {
    track('query_made', { game, message_index: messageIndex })
  },

  searchCompleted(game: string, sourceCount: number) {
    track('search_completed', { game, source_count: sourceCount })
  },

  sessionEnded(game: string, durationMs: number, messageCount: number) {
    track('session_ended', { game, duration_ms: durationMs, message_count: messageCount })
  },

  sessionError(game: string, error: string) {
    track('session_error', { game, error })
  },

  sessionTimedOut(game: string) {
    track('session_timed_out', { game })
  },
}
