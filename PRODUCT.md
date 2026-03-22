# Game Whisper — Product Overview

**For: Marketing Team**
**Last updated: March 2026**

---

## What Is Game Whisper?

Game Whisper is a Windows desktop app that gives you an AI gaming assistant you can talk to — without ever leaving your game.

Press a hotkey (default: **Alt+G**), ask your question out loud, and get a spoken answer in seconds. Game Whisper automatically knows which game you're playing, searches the relevant wiki for accurate information, and reads the answer back to you so you never have to alt-tab, Google, or lose focus.

---

## The Problem It Solves

Gamers constantly need help mid-session — boss strategies, item locations, quest steps, build advice — but looking things up means breaking immersion: minimizing the game, opening a browser, scrolling through wikis, then switching back. This is slow, disruptive, and pulls you out of the experience.

Game Whisper lives as a transparent overlay on top of your game, activated and dismissed with a single keypress. You talk; it answers; you stay in the game.

---

## Core Features

### Always-On Overlay
A sleek, glassmorphic overlay sits on top of your game — transparent, non-intrusive, and always-on-top. It can be positioned in any of four screen corners to stay out of the way of your HUD.

### Press-to-Talk Hotkey
A single global hotkey (rebindable) activates the assistant and starts listening. A second press ends the session. No clicking, no alt-tabbing.

### Automatic Game Detection
Game Whisper detects which game you're running and uses that context automatically. Supported titles include Elden Ring, Cyberpunk 2077, Baldur's Gate 3, and more — no manual configuration needed.

### AI Voice Assistant
Powered by **ElevenLabs Conversational AI**, the assistant understands natural speech and responds with a natural-sounding voice. Full duplex — it listens and speaks just like a conversation.

### Real-Time Wiki Search
When the assistant needs to look something up, it searches game-specific wikis automatically (using Fextralife and other trusted sources). You see an "amber" searching state on screen, and the answer comes back with the wiki data baked in.

### Live Transcripts
Your words and the assistant's responses are shown in real time on the overlay so you always know what was heard and what was said.

### Reactive Voice Orb
A central animated orb gives instant visual feedback:
- **Blue** — listening
- **Purple** — speaking
- **Amber** — searching the wiki
- **Red** — error

A 60-second progress ring keeps you aware of session time.

### Session History
Every conversation is saved and browsable. See all your previous Q&A sessions organized by game, with full transcripts, wiki sources, timestamps, and clickable links. Delete sessions you no longer need.

### Source Links
Answers include the wiki sources used. Links open directly in your browser. YouTube results show inline previews.

### Google Sign-In
One-click Google authentication. Sessions sync across reinstalls. Sign-in happens through your system browser — no password management needed.

### Audio Device Selection
Choose which microphone and speaker to use — useful for headsets, streaming setups, or multi-audio configurations.

### Fully Configurable
- Rebind the hotkey to any key combination
- Choose overlay screen position (4 corners)
- Toggle background transparency
- Select audio input/output devices
- Settings persist across app restarts

### System Tray Integration
Game Whisper runs quietly in the system tray. Show/hide the dashboard, adjust settings, or quit — all without cluttering your taskbar.

---

## Who It's For

- **RPG and strategy players** who frequently need build, quest, or lore information
- **Hardcore gamers** who don't want to break immersion by alt-tabbing
- **Streamers** who want to answer viewer questions about the game they're playing
- **Casual players** who want quick answers without learning wikis inside out
- Any PC gamer tired of constantly switching between their game and a browser

---

## Platform

- **Windows desktop app** (Tauri + React)
- **Free to sign in** with Google
- Sessions and history stored securely in the cloud (Firebase)
- AI and voice powered by ElevenLabs
- Wiki search powered by Firecrawl

---

## Current Status

Game Whisper is fully functional with voice sessions, wiki search, and session history. Analytics and answer quality improvements (LLM post-processing of wiki results) are on the roadmap.
