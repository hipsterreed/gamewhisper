import FirecrawlApp, { type SearchResultWeb, type Document } from '@mendable/firecrawl-js'
import { AppError } from '../lib/errors'

const SEARCH_TIMEOUT_MS = 12_000
const MAX_CHARS_PER_SOURCE = 3_000

const GAME_DOMAINS: Record<string, string[]> = {
  'Elden Ring': ['wiki.fextralife.com'],
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

  static async search(game: string, query: string): Promise<string> {
    const domains = GAME_DOMAINS[game] ?? []

    const req: Record<string, unknown> = {
      limit: 3,
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true },
    }
    if (domains.length > 0) {
      req.includeDomains = domains
    }

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new AppError('Wiki search timed out', 504, 'TIMEOUT')), SEARCH_TIMEOUT_MS),
    )

    const result = await Promise.race([WikiService.fc.search(`${game} ${query}`, req as never), timeout])
    const items = (result.web as WebResult[] | undefined) ?? []

    if (!items.length) {
      return 'No wiki data found for that query. Please answer based on your training data.'
    }

    return items
      .map((doc) => {
        const content = (doc.markdown ?? doc.description ?? '').slice(0, MAX_CHARS_PER_SOURCE)
        return `Source: ${doc.url}\n${content}`
      })
      .join('\n\n---\n\n')
  }
}
