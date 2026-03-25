import FirecrawlApp, { type SearchResultWeb, type Document } from '@mendable/firecrawl-js'
import { AppError } from '../lib/errors'
import { log } from '../lib/logger'

const SEARCH_TIMEOUT_MS = 25_000
const MAX_CHARS_PER_SOURCE = 8_000

const GAME_DOMAINS: Record<string, string[]> = {
  'Elden Ring': ['wiki.fextralife.com'],
  'Minecraft': ['minecraft.wiki'],
  'Stardew Valley': ['stardewvalleywiki.com'],
  'Cyberpunk 2077': ['cyberpunk.fandom.com'],
  "Baldur's Gate 3": ['bg3.wiki'],
  'Dark Souls III': ['darksouls3.wiki.fextralife.com'],
  'Dark Souls Remastered': ['darksouls.wiki.fextralife.com'],
  'Sekiro: Shadows Die Twice': ['sekiroshadowsdietwice.wiki.fextralife.com'],
  Bloodborne: ['bloodborne.wiki.fextralife.com'],
  'God of War': ['godofwar.fandom.com'],
  'The Witcher 3: Wild Hunt': ['witcher.fandom.com'],
  'Hogwarts Legacy': ['hogwartslegacy.fandom.com'],
}

type WebResult = SearchResultWeb & Document

export abstract class WikiService {
  private static fc = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! })

  static async search(game: string, query: string): Promise<{ text: string; sources: string[] }> {
    const domains = GAME_DOMAINS[game] ?? []

    const req: Record<string, unknown> = { limit: 3 }
    if (domains.length > 0) {
      req.includeDomains = domains
    }

    log('info', 'firecrawl/search: starting', { game, query, domains, searchQuery: `${game} ${query}` })
    const searchStart = Date.now()

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Wiki search timed out', 504, 'TIMEOUT')), SEARCH_TIMEOUT_MS),
    )

    const result = await Promise.race([WikiService.fc.search(`${game} ${query}`, req as never), timeout])
    const items = (result.web as WebResult[] | undefined) ?? []

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

    const sources: string[] = []
    const parts: string[] = []

    for (const item of items) {
      const url = item.url ?? ''
      const content = (item.markdown ?? item.description ?? '').slice(0, MAX_CHARS_PER_SOURCE)
      if (url && content) {
        sources.push(url)
        parts.push(`Source: ${url}\n${content}`)
      }
    }

    if (!parts.length) {
      log('warn', 'firecrawl/search: no content in search results', { game, query })
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
