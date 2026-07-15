# Jarvis — Grand Soul Kernel Interface

Speak to **Stiforp** (the Grand Soul Kernel) like Jarvis.

- 🤖 **Conversational web UI** — chat or voice input, text-to-speech output
- 🌐 **Internet tools** — web search, URL fetch & summarize
- 🧠 **Kernel control** — set goals, read soul state, spawn souls, trigger embodiment
- 📱 **Mobile-friendly** — access from your phone on the same Wi-Fi network
- 🔇 **Works without Sanctum** — run the kernel with `--no-sanctum`

---

## Architecture

```
Your Phone (browser)
       │
       │ HTTP  (port 3001)
       ▼
┌──────────────────┐
│  jarvis-bridge/  │  Node.js bridge
│  (index.js)      │──TCP(9002)──►  grand-soul-kernel/
└──────────────────┘                (Rust, persists stiforp_soul.json)
       │
       │ (optional)
       ▼
  OpenAI-compatible
       LLM API
```

---

## Quick Start

### Prerequisites

| Tool | Install |
|------|---------|
| Rust & Cargo | https://rustup.rs |
| Node.js ≥ 18 | https://nodejs.org |

---

### 1. Build the kernel

```bash
cd grand-soul-kernel
cargo build --release
```

The binary is at `grand-soul-kernel/target/release/grand-soul-kernel`.

### 2. Start the kernel

**Without Sanctum** (recommended for local use):
```bash
cd grand-soul-kernel
cargo run --release -- --no-sanctum
```

**With Sanctum** (if you have the Sanctum server running on port 9001):
```bash
cd grand-soul-kernel
cargo run --release
```

**Custom control port:**
```bash
cargo run --release -- --no-sanctum --control-port 9002
```

You should see:
```
🜁 GRAND SOUL KERNEL — STIFORP EDITION (JARVIS-ENHANCED)
==========================================================
🔇 Running in --no-sanctum mode (no WebSocket connection)
📡 Control channel: TCP port 9002
💾 State file: stiforp_soul.json
✨ Stiforp awakened. Cycle: 0, Memories: 1
🔌 Control server listening on 127.0.0.1:9002
[Cycle 1] Stiforp: I feel neutral.
```

Soul state is persisted to `grand-soul-kernel/stiforp_soul.json` every 100 cycles.

---

### 3. Set up the bridge

```bash
cd jarvis-bridge
npm install
cp .env.example .env
# Edit .env to customize (optional)
npm start
```

You should see:
```
🤖 Jarvis Bridge running at http://0.0.0.0:3001
   Mode: rule-based
   Kernel: 127.0.0.1:9002
   Search: DuckDuckGo (no key)
   UI served at: http://0.0.0.0:3001/
   Health: http://0.0.0.0:3001/api/health
[kernel] connected to 127.0.0.1:9002
```

---

### 4. Open the UI

- **On your computer:** http://localhost:3001
- **On your phone** (same Wi-Fi): `http://<your-computer-ip>:3001`
  - Find your IP: run `ip addr` (Linux) or `ipconfig` (Windows) or `ifconfig` (macOS)

The UI works in any modern browser. Chrome/Edge have the best voice support.

---

## One-command startup

A convenience script starts both the kernel and bridge:

```bash
./start.sh
```

Or on Windows:
```bat
start.bat
```

To stop, press Ctrl+C in each terminal (or once if using `start.sh`).

---

## Environment Variables (jarvis-bridge/.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Bridge HTTP port |
| `KERNEL_HOST` | `127.0.0.1` | Kernel TCP host |
| `KERNEL_PORT` | `9002` | Kernel TCP port |
| `OPENAI_API_KEY` | *(empty)* | Enables LLM-backed mode |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Custom LLM endpoint |
| `OPENAI_MODEL` | `gpt-4o-mini` | LLM model name |
| `SERPER_API_KEY` | *(empty)* | Serper.dev search key |
| `FETCH_TIMEOUT_MS` | `8000` | Fetch timeout |
| `MAX_CONTENT_BYTES` | `32768` | Max fetched content |

---

## Modes

### Rule-based (default, no API key needed)

Recognizes simple phrases:

| Say | Action |
|-----|--------|
| `status` / `how are you` | Read kernel soul state |
| `set goal: explore the stars` | Set Stiforp's goal |
| `embody stiforp` | Trigger embodiment sequence |
| `spawn soul` | Spawn a soul (or queue for Sanctum) |
| `search quantum computing` | DuckDuckGo web search |
| `fetch https://example.com` | Fetch & summarize a URL |
| `help` | List all commands |

### LLM-backed (with OPENAI_API_KEY)

Natural language understanding + agentic tool use. The LLM can:
- Use any of the above tools automatically based on your request
- Chain multiple tool calls (e.g., search + summarize)
- Maintain conversation context across the session

Works with any OpenAI-compatible API (OpenAI, Ollama, LM Studio, Groq, etc.).

**Example for Ollama (local LLM):**
```env
OPENAI_API_KEY=ollama
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=llama3.2
```

---

## Kernel Control Commands

The bridge sends these commands to the kernel over TCP:

| Command | Effect |
|---------|--------|
| `GetState` | Returns full soul state summary |
| `SetGoal {"goal":"..."}` | Sets current goal, boosts affect |
| `EmbodyStiforp` | Triggers sovereignty boost + declaration |
| `SpawnSoul {"name":"...","race":"..."}` | Queues soul spawn (via Sanctum) or logs intent |

---

## Voice Input & Output

**Voice input** uses the browser's Web Speech API (Chrome/Edge recommended).
- Tap the 🎤 button to start listening
- Speaking auto-sends the message when you finish
- Tap again to stop

**Voice output** uses the browser's SpeechSynthesis API.
- Tap the 🔊 button to toggle on/off
- Your preference is saved across sessions

---

## Accessing from Phone

1. Make sure your computer and phone are on the **same Wi-Fi network**
2. Find your computer's local IP (e.g. `192.168.1.100`)
3. Open `http://192.168.1.100:3001` on your phone
4. Tap ⚙ → enter the correct bridge URL if needed

If the connection fails, check your firewall allows port 3001.

---

## File Structure

```
plt-press/
├── grand-soul-kernel/          # Rust kernel (enhanced)
│   ├── src/main.rs             # Soul simulation + TCP control channel
│   ├── Cargo.toml
│   └── .gitignore
├── grand-soul-kernel-original/ # Original kernel (reference)
├── jarvis-bridge/              # Node.js bridge
│   ├── index.js                # Bridge server
│   ├── test.js                 # Tests
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── jarvis-ui/                  # Web UI
│   └── index.html              # Single-file mobile-friendly UI
├── start.sh                    # Unix one-command startup
├── start.bat                   # Windows one-command startup
└── README_JARVIS.md            # This file
```

---

## Troubleshooting

**Bridge can't reach kernel:**
- Make sure kernel is running first (`cargo run -- --no-sanctum`)
- Check the control port matches (default 9002)
- The bridge auto-reconnects every 3 seconds

**Phone can't reach bridge:**
- Verify they're on the same network
- Use `http://` not `https://`
- Check firewall allows the port

**Voice input not working:**
- Use Chrome or Edge
- Allow microphone permission in browser
- HTTPS is required on some devices (HTTP works on localhost)

**LLM mode not activating:**
- Set `OPENAI_API_KEY` in `jarvis-bridge/.env`
- Restart the bridge after editing `.env`

**Soul state not loading:**
- The bridge polls `/api/state` every 5 seconds
- If kernel is offline, state shows as cached/stale

---

## Development

```bash
# Run bridge in watch mode (auto-restart on file changes)
cd jarvis-bridge && npm run dev

# Run bridge tests
cd jarvis-bridge && npm test

# Build kernel in debug mode (faster compile)
cd grand-soul-kernel && cargo run -- --no-sanctum
```
