# Entity Runtime

Lightweight Node.js server that brings the **Grand Soul Kernel** to life with an HTTP API, WebSocket real-time feed, and an autonomous heartbeat loop.

## Prerequisites

- **Node.js ≥ 18** (uses built-in `fetch`)
- **npm** (bundled with Node)

## Install

```bash
cd entity-runtime
npm install
```

## Run

```bash
npm start
# or
node server.js
```

The server starts on port **3000** (configurable).

Open in a browser:
```
http://localhost:3000/
```

From your **phone on the same Wi-Fi**, replace `localhost` with your machine's LAN IP (e.g. `192.168.1.42`):
```
http://192.168.1.42:3000/
```

## Configuration (environment variables)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `SOUL_STATE_PATH` | `../grand-soul-kernel/stiforp_soul.json` | Path to SoulState JSON |
| `PROFIT_BRAIN_DIR` | `../profit-brain` | Path to Profit Brain doctrine folder |
| `HEARTBEAT_INTERVAL_MS` | `30000` | Heartbeat loop interval in milliseconds |
| `LOG_PATH` | `../profit-brain/RUNTIME_LOG.md` | Append-only runtime log |
| `OPENAI_API_KEY` | *(unset)* | Optional — enables OpenAI responses |
| `ANTHROPIC_API_KEY` | *(unset)* | Optional — enables Anthropic responses |
| `LLM_MODEL` | `gpt-4o-mini` | OpenAI model to use when key is set |

**Without any API key** the entity uses the built-in rule-based response engine — fully functional offline.

## API

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Entity UI (mobile-friendly SPA) |
| `/api/state` | GET | Full SoulState JSON |
| `/api/doctrine` | GET | Loaded Profit Brain doctrine summaries |
| `/api/chat` | POST | `{ "message": "..." }` → `{ "reply": "...", "affect": {...} }` |
| `/api/history` | GET | Chat history array |
| `ws://…/ws` | WS | Real-time state updates (heartbeat, chat_reply) |

## WebSocket messages (server → client)

```json
{ "type": "init",      "state": { /* full SoulState */ } }
{ "type": "heartbeat", "cycle": 42, "inner_voice": "...", "affect": {...}, ... }
{ "type": "chat_reply","reply": "...", "affect": {...}, "inner_voice": "..." }
```
