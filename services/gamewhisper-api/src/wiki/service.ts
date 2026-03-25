import FirecrawlApp, { type SearchResultWeb, type Document } from '@mendable/firecrawl-js'
import { AppError } from '../lib/errors'
import { log } from '../lib/logger'

const SEARCH_TIMEOUT_MS = 30_000
const SCRAPE_TIMEOUT_MS = 5_000
const MAX_CHARS_PER_SOURCE = 12_000
// Cache wiki pages for 1 hour — content is mostly static, repeat queries are near-instant
const SCRAPE_CACHE_MAX_AGE_MS = 60 * 60 * 1_000

const UNSCRAPPABLE = ['youtube.com', 'youtu.be', 'twitch.tv', 'tiktok.com']

type WebResult = SearchResultWeb & Document

export abstract class WikiService {
  private static fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

  static async search(game: string, query: string): Promise<{ text: string; sources: string[] }> {
    const hardTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Wiki search timed out', 504, 'TIMEOUT')), SEARCH_TIMEOUT_MS),
    )

    // Step 1: search — returns top results with URL + description snippet
    log('info', 'firecrawl/search: starting', { game, query, searchQuery: `${game} ${query}` })
    const searchStart = Date.now()

    const searchResult = await Promise.race([
      WikiService.fc.search(`${game} ${query}`, { limit: 2 } as never),
      hardTimeout,
    ])
    const items = (searchResult.web as WebResult[] | undefined) ?? []

    log('info', 'firecrawl/search: got results', {
      game,
      query,
      resultCount: items.length,
      urls: items.map((d) => d.url ?? ''),
      durationMs: Date.now() - searchStart,
    })

    if (!items.length) {
      log('warn', 'firecrawl/search: no results found', { game, query })
      return { text: 'No wiki data found for that query. Please answer based on your training data.', sources: [] }
    }

    const scrapeUrls = items
      .map((d) => d.url)
      .filter((u): u is string => !!u && !UNSCRAPPABLE.some((d) => u.includes(d)))

    // Step 2: fire individual scrapes in parallel, return as soon as the first one
    // comes back with content. Much faster than waiting for a batch job to finish.
    log('info', 'firecrawl/scrape: racing individual scrapes', { urls: scrapeUrls })
    const scrapeStart = Date.now()

    type ScrapeWin = { url: string; content: string }
    const scrapeDeadline = new Promise<null>((resolve) => setTimeout(() => resolve(null), SCRAPE_TIMEOUT_MS))

    const scrapeRaces = scrapeUrls.map((url) =>
      WikiService.fc
        .scrape(url, {
          formats: ['markdown'],
          onlyMainContent: true,
          fastMode: true,
          maxAge: SCRAPE_CACHE_MAX_AGE_MS,
        } as never)
        .then((result) => {
          const content = (result.markdown ?? '').trim()
          if (!content) throw new Error('no content')
          return { url, content } as ScrapeWin
        }),
    )

    const winner = await Promise.race([Promise.any(scrapeRaces), scrapeDeadline])
    const scrapeDurationMs = Date.now() - scrapeStart

    if (!winner) {
      log('warn', 'firecrawl/scrape: all timed out, falling back to search snippets', { urls: scrapeUrls, scrapeDurationMs })
    } else {
      log('info', 'firecrawl/scrape: got first result', { url: winner.url, scrapeDurationMs, chars: winner.content.length })
    }

    // Step 3: build response — prefer scraped content, fall back to search snippets
    const sources: string[] = []
    const parts: string[] = []

    if (winner) {
      sources.push(winner.url)
      parts.push(`Source: ${winner.url}\n${winner.content.slice(0, MAX_CHARS_PER_SOURCE)}`)
    }

    // Append search snippets from the other sources (free context we already have)
    for (const item of items) {
      const url = item.url ?? ''
      if (!url || sources.includes(url)) continue
      const snippet = (item.markdown ?? item.description ?? '').trim()
      if (snippet) {
        sources.push(url)
        parts.push(`Source: ${url}\n${snippet}`)
      }
    }

    // Fall back to search snippets if scrape timed out or returned no content
    if (!parts.length) {
      for (const item of items) {
        const url = item.url ?? ''
        const content = (item.markdown ?? item.description ?? '').slice(0, MAX_CHARS_PER_SOURCE)
        if (url && content) {
          sources.push(url)
          parts.push(`Source: ${url}\n${content}`)
        }
      }
    }

    if (!parts.length) {
      log('warn', 'firecrawl/search: no content from search or scrape', { game, query })
      return { text: 'No wiki data found for that query. Please answer based on your training data.', sources: [] }
    }

    log('info', 'firecrawl/search: returning result to ElevenLabs', {
      game,
      query,
      timedOut: !winner,
      sourceCount: sources.length,
      sources,
      totalChars: parts.join('').length,
    })

    return { text: parts.join('\n\n---\n\n'), sources }
  }
}
