import FirecrawlApp, { type SearchResultWeb, type Document } from '@mendable/firecrawl-js'
import { AppError } from '../lib/errors'
import { log } from '../lib/logger'

const SEARCH_TIMEOUT_MS = 45_000
const MAX_CHARS_PER_SOURCE = 12_000
// Cache wiki pages for 1 hour — content is mostly static, this makes repeat queries near-instant
const SCRAPE_CACHE_MAX_AGE_MS = 60 * 60 * 1_000

type WebResult = SearchResultWeb & Document

export abstract class WikiService {
  private static fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

  static async search(game: string, query: string): Promise<{ text: string; sources: string[] }> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Wiki search timed out', 504, 'TIMEOUT')), SEARCH_TIMEOUT_MS),
    )

    // Step 1: search for the most relevant URLs
    log('info', 'firecrawl/search: starting', { game, query, searchQuery: `${game} ${query}` })
    const searchStart = Date.now()

    const searchResult = await Promise.race([
      WikiService.fc.search(`${game} ${query}`, { limit: 5 } as never),
      timeout,
    ])
    const items = (searchResult.web as WebResult[] | undefined) ?? []
    const urls = items.map((d) => d.url).filter((u): u is string => !!u)

    log('info', 'firecrawl/search: got results', {
      game,
      query,
      resultCount: items.length,
      urls,
      durationMs: Date.now() - searchStart,
    })

    if (!urls.length) {
      log('warn', 'firecrawl/search: no results found', { game, query })
      return { text: 'No wiki data found for that query. Please answer based on your training data.', sources: [] }
    }

    // Step 2: batch scrape all URLs for full page content
    // maxAge uses cache so repeat queries on the same wiki pages are near-instant
    log('info', 'firecrawl/batch-scrape: starting', { urls })
    const scrapeStart = Date.now()

    const scrapeResult = await Promise.race([
      WikiService.fc.batchScrape(urls, {
        formats: ['markdown'],
        onlyMainContent: true,
        maxAge: SCRAPE_CACHE_MAX_AGE_MS,
      } as never),
      timeout,
    ])

    const scraped = (scrapeResult as { data?: Array<{ url?: string; markdown?: string }> }).data ?? []

    log('info', 'firecrawl/batch-scrape: done', {
      requested: urls.length,
      received: scraped.length,
      durationMs: Date.now() - scrapeStart,
    })

    // Step 3: build response from full scraped content
    const sources: string[] = []
    const parts: string[] = []

    for (const page of scraped) {
      const url = page.url ?? ''
      const content = (page.markdown ?? '').slice(0, MAX_CHARS_PER_SOURCE)
      if (url && content) {
        sources.push(url)
        parts.push(`Source: ${url}\n${content}`)
      }
    }

    if (!parts.length) {
      log('warn', 'firecrawl/batch-scrape: no content returned', { urls })
      return { text: 'No wiki data found for that query. Please answer based on your training data.', sources: [] }
    }

    log('info', 'firecrawl/search: returning result to ElevenLabs', {
      game,
      query,
      sourceCount: sources.length,
      sources,
      totalChars: parts.join('').length,
    })

    return { text: parts.join('\n\n---\n\n'), sources }
  }
}
