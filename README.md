> Built for the <picture><source media="(prefers-color-scheme: dark)" srcset="apps/gamewhisper-marketing/src/assets/firecrawl-wordmark-white.svg"><img src="apps/gamewhisper-marketing/src/assets/firecrawl-wordmark.svg" height="28" valign="middle"></picture> × <picture><source media="(prefers-color-scheme: dark)" srcset="apps/gamewhisper-marketing/src/assets/elevenlabs-logo-white.png"><img src="apps/gamewhisper-marketing/src/assets/elevenlabs-logo-black.png" height="14" valign="middle"></picture> Hackathon — the challenge was to build something unique using both [Firecrawl Search](https://firecrawl.dev) and [ElevenAgents](https://elevenlabs.io/conversational-ai). [Watch the demo →](https://gamewhisper.io)

---

# GameWhisper

**Voice AI assistant for gamers — press a hotkey, ask anything.**

Press `Alt+G` while gaming, ask a question out loud, and get a spoken answer powered by real wiki data. No alt-tabbing. No pausing. Just whisper to your game.

![GameWhisper overlay screenshot](https://firebasestorage.googleapis.com/v0/b/gamewhisper-69fae.firebasestorage.app/o/Screenshot%202026-03-25%20011221.png?alt=media&token=2c4fd9bc-f6dc-4aea-990e-aeea24be9c02)

---

## How It Works

1. Press `Alt+G` — a transparent overlay appears over your game
2. Your active game is auto-detected
3. Speak your question — the mic activates immediately
4. The agent searches game wikis in real time via Firecrawl
5. ElevenLabs voices the answer back to you, live

---

## Features

- Game auto-detection via Win32 process scanning
- Full-duplex voice conversation (ElevenLabs Conversational AI)
- Real-time wiki search — pulls from Fextralife, wiki.gg, and more
- Session history with full transcripts and source links
- Google sign-in, persisted across restarts
- Customizable hotkey, mic/output device, and overlay position
- Glassmorphic always-on-top overlay — never blocks your game

---

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop | Tauri v2 + React + TypeScript (Windows) |
| API | ElysiaJS + Bun |
| Voice | ElevenLabs Conversational AI |
| Wiki search | Firecrawl Search API |
| Auth + Storage | Firebase (Google Auth + Firestore) |

---

## Getting Started

**Prerequisites:** [Bun](https://bun.sh), [Rust toolchain](https://rustup.rs), an ElevenLabs account, a Firecrawl API key

```bash
git clone https://github.com/your-username/game-whisper.git
cd game-whisper
bun install
```

**Desktop app** (`apps/gamewhisper-desktop/`):

1. Copy `.env.local.example` to `.env.local` and fill in your Firebase + ElevenLabs values
2. `bun run desktop` — launches the Tauri dev build

**API service** (`services/gamewhisper-api/`):

1. Copy `.env.example` to `.env` and add `INTERNAL_API_KEY` and `FIRECRAWL_API_KEY`
2. `bun dev` — starts the ElysiaJS server

---

## License

MIT
