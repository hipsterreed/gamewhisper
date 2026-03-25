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
      WikiService.fc.search(`${game} ${query}`, { limit: 3 } as never),
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

    // Step 2: batch scrape for full page content, but race against a hard 5s deadline.
    // If scrape is too slow (cold cache), fall back to the search result descriptions
    // so the agent always gets a response in seconds.
    log('info', 'firecrawl/batch-scrape: starting', { urls: scrapeUrls })
    const scrapeStart = Date.now()

    const scrapeDeadline = new Promise<null>((resolve) => setTimeout(() => resolve(null), SCRAPE_TIMEOUT_MS))

    const scrapeResult = scrapeUrls.length
      ? await Promise.race([
          WikiService.fc.batchScrape(scrapeUrls, {
            options: {
              formats: ['markdown'],
              onlyMainContent: true,
              fastMode: true,
              maxAge: SCRAPE_CACHE_MAX_AGE_MS,
            },
          }),
          scrapeDeadline,
        ])
      : null

    const scrapeDurationMs = Date.now() - scrapeStart
    const timedOut = scrapeResult === null

    if (timedOut) {
      log('warn', 'firecrawl/batch-scrape: timed out, falling back to search snippets', { urls: scrapeUrls, scrapeDurationMs })
    } else {
      log('info', 'firecrawl/batch-scrape: done', {
        requested: scrapeUrls.length,
        received: scrapeResult.data?.length ?? 0,
        scrapeDurationMs,
      })
    }

    // Step 3: build response — prefer full scraped content, fall back to search snippets
    const sources: string[] = []
    const parts: string[] = []

    if (!timedOut) {
      for (const page of scrapeResult.data ?? []) {
        const url = page.metadata?.url ?? ''
        const content = (page.markdown ?? '').slice(0, MAX_CHARS_PER_SOURCE)
        if (url && content) {
          sources.push(url)
          parts.push(`Source: ${url}\n${content}`)
        }
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
      timedOut,
      sourceCount: sources.length,
      sources,
      totalChars: parts.join('').length,
    })

    return { text: parts.join('\n\n---\n\n'), sources }
  }
}
