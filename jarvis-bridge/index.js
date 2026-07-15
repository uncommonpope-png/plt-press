/**
 * Jarvis Bridge — Grand Soul Kernel Interface
 *
 * Exposes:
 *   POST /api/chat       { message, sessionId? } → assistant response
 *   GET  /api/health     → { ok, kernel_connected, mode }
 *   GET  /api/state      → latest kernel soul state
 *
 * Modes:
 *   - rule-based (default): maps intents to kernel commands + web actions
 *   - llm-backed: uses OPENAI_API_KEY (or OPENAI_BASE_URL) for natural language
 *
 * Environment variables (see .env.example):
 *   PORT               Bridge HTTP port (default 3001)
 *   KERNEL_HOST        Kernel TCP host (default 127.0.0.1)
 *   KERNEL_PORT        Kernel TCP port (default 9002)
 *   OPENAI_API_KEY     Enables LLM-backed mode
 *   OPENAI_BASE_URL    Custom OpenAI-compatible base URL
 *   OPENAI_MODEL       Model name (default gpt-4o-mini)
 *   SERPER_API_KEY     Enables Serper.dev web search (optional)
 *   FETCH_TIMEOUT_MS   HTTP fetch timeout in ms (default 8000)
 *   MAX_CONTENT_BYTES  Max fetched content size (default 32768)
 */

'use strict';

const express = require('express');
const cors = require('cors');
const net = require('net');
const path = require('path');

// ─── Config ─────────────────────────────────────────────────────────────────

// Load .env file if present (no dotenv dep needed — manual parse)
try {
  const envPath = path.join(__dirname, '.env');
  const fs = require('fs');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !(key in process.env)) process.env[key] = value;
    }
  }
} catch (_) {}

const PORT = parseInt(process.env.PORT || '3001', 10);
const KERNEL_HOST = process.env.KERNEL_HOST || '127.0.0.1';
const KERNEL_PORT = parseInt(process.env.KERNEL_PORT || '9002', 10);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '';
const FETCH_TIMEOUT_MS = parseInt(process.env.FETCH_TIMEOUT_MS || '8000', 10);
const MAX_CONTENT_BYTES = parseInt(process.env.MAX_CONTENT_BYTES || '32768', 10);

const LLM_MODE = !!OPENAI_API_KEY;

// ─── Kernel Connection ────────────────────────────────────────────────────────

/** Simple persistent TCP connection to the Rust kernel */
class KernelClient {
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.socket = null;
    this.buffer = '';
    this.pendingCallbacks = new Map(); // requestId → { resolve, reject, timer }
    this.latestState = null;
    this.connected = false;
    this._reqCounter = 0;
    this._breathListeners = [];
    this._reconnectTimer = null;
    this._connect();
  }

  _connect() {
    if (this.socket) {
      try { this.socket.destroy(); } catch (_) {}
    }
    this.socket = new net.Socket();
    this.socket.on('connect', () => {
      console.log(`[kernel] connected to ${this.host}:${this.port}`);
      this.connected = true;
      this.buffer = '';
      // Request initial state
      this._sendRaw(JSON.stringify({ cmd: 'GetState' }) + '\n');
    });
    this.socket.on('data', (chunk) => {
      this.buffer += chunk.toString();
      let nlIdx;
      while ((nlIdx = this.buffer.indexOf('\n')) >= 0) {
        const line = this.buffer.slice(0, nlIdx).trim();
        this.buffer = this.buffer.slice(nlIdx + 1);
        if (line) this._handleLine(line);
      }
    });
    this.socket.on('close', () => {
      console.log('[kernel] disconnected');
      this.connected = false;
      // Reject all pending
      for (const [, cb] of this.pendingCallbacks) {
        clearTimeout(cb.timer);
        cb.reject(new Error('Kernel disconnected'));
      }
      this.pendingCallbacks.clear();
      this._scheduleReconnect();
    });
    this.socket.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED' && err.code !== 'ENOENT') {
        console.error('[kernel] socket error:', err.message);
      }
    });

    try {
      this.socket.connect(this.port, this.host);
    } catch (err) {
      this._scheduleReconnect();
    }
  }

  _scheduleReconnect() {
    if (this._reconnectTimer) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._connect();
    }, 3000);
  }

  _handleLine(line) {
    let msg;
    try { msg = JSON.parse(line); } catch (_) { return; }

    // Breath push: broadcast to listeners
    if (msg.type === 'breath') {
      this.latestState = msg;
      for (const fn of this._breathListeners) {
        try { fn(msg); } catch (_) {}
      }
      return;
    }

    // State response
    if (msg.type === 'state' && msg.state) {
      this.latestState = msg.state;
    }

    // Match to pending request (simple: resolve oldest pending)
    const firstKey = this.pendingCallbacks.keys().next().value;
    if (firstKey !== undefined) {
      const cb = this.pendingCallbacks.get(firstKey);
      this.pendingCallbacks.delete(firstKey);
      clearTimeout(cb.timer);
      cb.resolve(msg);
    }
  }

  _sendRaw(text) {
    if (this.socket && this.connected) {
      this.socket.write(text);
    }
  }

  /**
   * Send a command and wait for a response (with timeout).
   */
  sendCommand(cmd, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('Kernel not connected'));
      }
      const id = ++this._reqCounter;
      const timer = setTimeout(() => {
        this.pendingCallbacks.delete(id);
        reject(new Error('Kernel command timed out'));
      }, timeoutMs);
      this.pendingCallbacks.set(id, { resolve, reject, timer });
      this._sendRaw(JSON.stringify(cmd) + '\n');
    });
  }

  onBreath(fn) {
    this._breathListeners.push(fn);
  }
}

const kernel = new KernelClient(KERNEL_HOST, KERNEL_PORT);

// ─── Tool: Web Search ─────────────────────────────────────────────────────────

async function webSearch(query) {
  if (SERPER_API_KEY) {
    return searchViaSerper(query);
  }
  return searchViaDuckDuckGo(query);
}

async function searchViaSerper(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': SERPER_API_KEY,
      },
      body: JSON.stringify({ q: query, num: 5 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const data = await res.json();
    const results = (data.organic || []).slice(0, 5).map((r) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet || '',
    }));
    return { results, source: 'serper' };
  } catch (err) {
    clearTimeout(timer);
    return { results: [], error: err.message, source: 'serper' };
  }
}

async function searchViaDuckDuckGo(query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();

    const results = [];
    // Abstract
    if (data.Abstract) {
      results.push({ title: data.Heading || query, url: data.AbstractURL || '', snippet: data.Abstract });
    }
    // Related topics
    for (const topic of (data.RelatedTopics || []).slice(0, 4)) {
      if (topic.Text && topic.FirstURL) {
        results.push({ title: topic.Text.slice(0, 80), url: topic.FirstURL, snippet: topic.Text });
      }
    }
    return { results: results.slice(0, 5), source: 'duckduckgo' };
  } catch (err) {
    clearTimeout(timer);
    return { results: [], error: err.message, source: 'duckduckgo' };
  }
}

// ─── Tool: URL Fetch + Extract ────────────────────────────────────────────────

function extractText(html) {
  // Strip scripts and styles
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  // Strip HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

async function fetchURL(rawUrl) {
  // Safety: only http/https
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_) {
    return { error: 'Invalid URL', url: rawUrl };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { error: 'Only http/https URLs are allowed', url: rawUrl };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(parsed.href, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Jarvis-Bridge/1.0 (+https://github.com/uncommonpope-png/plt-press)' },
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    let text;
    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      const raw = await res.text();
      const truncated = raw.length > MAX_CONTENT_BYTES;
      const limited = raw.slice(0, MAX_CONTENT_BYTES);
      text = contentType.includes('text/html') ? extractText(limited) : limited;
      return { url: parsed.href, text, length: text.length, truncated };
    } else {
      return { error: `Unsupported content type: ${contentType}`, url: parsed.href };
    }
  } catch (err) {
    clearTimeout(timer);
    return { error: err.message, url: parsed.href };
  }
}

// ─── Tool: Summarize ─────────────────────────────────────────────────────────

function heuristicSummarize(text, maxSentences = 5) {
  // Split on sentence boundaries and return the first N sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

async function summarize(text) {
  if (!LLM_MODE) {
    return heuristicSummarize(text, 5);
  }
  // LLM summarization
  try {
    const response = await llmChat([
      { role: 'system', content: 'Summarize the following text in 2-4 sentences. Be concise.' },
      { role: 'user', content: text.slice(0, 4000) },
    ], { max_tokens: 200 });
    return response.content;
  } catch (_) {
    return heuristicSummarize(text, 5);
  }
}

// ─── LLM Chat ────────────────────────────────────────────────────────────────

async function llmChat(messages, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const body = {
      model: OPENAI_MODEL,
      messages,
      max_tokens: opts.max_tokens || 512,
      temperature: opts.temperature ?? 0.7,
    };
    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LLM API error ${res.status}: ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    return { content, usage: data.usage };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ─── Rule-Based Intent Handler ────────────────────────────────────────────────

const INTENT_PATTERNS = [
  { re: /\b(status|state|how are you|how is stiforp|how do you feel)\b/i, intent: 'get_state' },
  { re: /\b(set goal|your goal|goal is)\s*[:=]?\s*(.+)/i, intent: 'set_goal' },
  { re: /\b(embody stiforp|become stiforp|awaken|embody)\b/i, intent: 'embody_stiforp' },
  { re: /\b(spawn|create|birth)\s*(a\s+)?soul\b/i, intent: 'spawn_soul' },
  { re: /\b(search|look up|find|google)\s+(.+)/i, intent: 'search' },
  { re: /\b(fetch|open|read|browse|visit|go to)\s+(https?:\/\/\S+)/i, intent: 'fetch_url' },
  { re: /\b(summarize|sum up|tldr)\s+(https?:\/\/\S+)/i, intent: 'summarize_url' },
  { re: /\b(help|what can you do|commands)\b/i, intent: 'help' },
];

function matchIntent(message) {
  for (const { re, intent } of INTENT_PATTERNS) {
    const m = message.match(re);
    if (m) return { intent, match: m };
  }
  return { intent: 'unknown', match: null };
}

async function handleRuleBased(message) {
  const { intent, match } = matchIntent(message);
  const actions = [];

  switch (intent) {
    case 'get_state': {
      let state;
      try {
        const res = await kernel.sendCommand({ cmd: 'GetState' });
        state = res.state || res;
      } catch (err) {
        state = kernel.latestState;
        if (!state) return { reply: `I cannot reach the kernel right now (${err.message}). Try again shortly.`, actions };
      }
      actions.push({ type: 'kernel_state', data: state });
      return {
        reply: formatStateReply(state),
        actions,
      };
    }

    case 'set_goal': {
      const goal = (match?.[2] || message.replace(/set goal\s*/i, '')).trim();
      if (!goal) return { reply: 'What goal should I set?', actions };
      try {
        const res = await kernel.sendCommand({ cmd: 'SetGoal', goal });
        actions.push({ type: 'kernel_command', cmd: 'SetGoal', goal });
        return { reply: `Goal set: "${goal}". ${res.inner_voice || ''}`, actions };
      } catch (err) {
        return { reply: `Could not set goal: ${err.message}`, actions };
      }
    }

    case 'embody_stiforp': {
      try {
        const res = await kernel.sendCommand({ cmd: 'EmbodyStiforp' });
        actions.push({ type: 'kernel_command', cmd: 'EmbodyStiforp' });
        return { reply: `Embodiment activated. ${res.inner_voice || 'I am Stiforp.'}`, actions };
      } catch (err) {
        return { reply: `Embodiment failed: ${err.message}`, actions };
      }
    }

    case 'spawn_soul': {
      try {
        const res = await kernel.sendCommand({ cmd: 'SpawnSoul', name: 'Newborn', race: 'Human', x: 100, y: 100 });
        actions.push({ type: 'kernel_command', cmd: 'SpawnSoul' });
        return { reply: res.message || 'Soul spawned.', actions };
      } catch (err) {
        return { reply: `Could not spawn soul: ${err.message}`, actions };
      }
    }

    case 'search': {
      const query = (match?.[2] || message.replace(/^(search|look up|find|google)\s*/i, '')).trim();
      actions.push({ type: 'search', query });
      const { results, error, source } = await webSearch(query);
      if (error && results.length === 0) {
        return { reply: `Search failed: ${error}`, actions };
      }
      if (results.length === 0) {
        return { reply: `No results found for "${query}".`, actions };
      }
      const lines = results.map((r, i) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.url}`);
      return { reply: `Search results (via ${source}):\n\n${lines.join('\n\n')}`, actions };
    }

    case 'fetch_url': {
      const url = match?.[2] || '';
      actions.push({ type: 'fetch', url });
      const result = await fetchURL(url);
      if (result.error) return { reply: `Fetch failed: ${result.error}`, actions };
      const summary = await summarize(result.text);
      return { reply: `From ${url}:\n\n${summary}`, actions };
    }

    case 'summarize_url': {
      const url = match?.[2] || '';
      actions.push({ type: 'fetch', url }, { type: 'summarize', url });
      const result = await fetchURL(url);
      if (result.error) return { reply: `Fetch failed: ${result.error}`, actions };
      const summary = await summarize(result.text);
      return { reply: `Summary of ${url}:\n\n${summary}`, actions };
    }

    case 'help':
      return {
        reply: [
          '**Jarvis commands:**',
          '• *status* — show Stiforp soul state',
          '• *set goal: [goal]* — give Stiforp a goal',
          '• *embody stiforp* — activate full embodiment',
          '• *spawn soul* — create a new soul (queued for Sanctum)',
          '• *search [query]* — web search',
          '• *fetch [url]* — fetch and summarize a URL',
          '• *summarize [url]* — fetch and summarize a URL',
        ].join('\n'),
        actions,
      };

    default:
      return {
        reply: `I heard you say: "${message}". I'm not sure how to handle that. Try "help" to see what I can do.`,
        actions,
      };
  }
}

// ─── LLM-Backed Handler ───────────────────────────────────────────────────────

const LLM_SYSTEM_PROMPT = `You are Jarvis, the AI assistant for the Grand Soul Kernel ("Stiforp").
You have access to the following tools (call them by replying ONLY with a JSON object on a line by itself):

{"tool":"get_state"}                          — get current kernel state
{"tool":"set_goal","goal":"<goal>"}           — set kernel goal
{"tool":"embody_stiforp"}                     — activate Stiforp embodiment
{"tool":"spawn_soul","name":"<n>","race":"<r>"} — spawn a soul
{"tool":"search","query":"<q>"}               — web search
{"tool":"fetch","url":"<url>"}                — fetch and summarize URL

After using a tool, you will receive the result and should then reply in plain English.
Be concise and helpful. If you use a tool, wait for the result before answering.
If you don't need a tool, reply directly.`;

async function handleLLMBacked(message, history = []) {
  const actions = [];
  const messages = [
    { role: 'system', content: LLM_SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: message },
  ];

  // Add kernel state context if available
  if (kernel.latestState) {
    const stateSnippet = JSON.stringify(kernel.latestState).slice(0, 400);
    messages[0] = {
      role: 'system',
      content: LLM_SYSTEM_PROMPT + `\n\nCurrent kernel state (snapshot): ${stateSnippet}`,
    };
  }

  // Agentic loop: up to 3 tool calls
  for (let i = 0; i < 3; i++) {
    let llmReply;
    try {
      llmReply = await llmChat(messages);
    } catch (err) {
      // Fall back to rule-based if LLM fails
      console.error('[llm] error, falling back to rule-based:', err.message);
      return handleRuleBased(message);
    }

    const content = llmReply.content.trim();

    // Check if the reply is a tool call
    const toolMatch = content.match(/^\s*(\{[\s\S]*?\})\s*$/);
    if (toolMatch) {
      let toolCall;
      try { toolCall = JSON.parse(toolMatch[1]); } catch (_) { break; }

      messages.push({ role: 'assistant', content });

      let toolResult;
      switch (toolCall.tool) {
        case 'get_state': {
          try {
            const res = await kernel.sendCommand({ cmd: 'GetState' });
            toolResult = JSON.stringify(res.state || res);
          } catch (err) {
            toolResult = `Error: ${err.message}`;
          }
          actions.push({ type: 'kernel_state' });
          break;
        }
        case 'set_goal': {
          try {
            const res = await kernel.sendCommand({ cmd: 'SetGoal', goal: toolCall.goal || '' });
            toolResult = JSON.stringify(res);
          } catch (err) {
            toolResult = `Error: ${err.message}`;
          }
          actions.push({ type: 'kernel_command', cmd: 'SetGoal', goal: toolCall.goal });
          break;
        }
        case 'embody_stiforp': {
          try {
            const res = await kernel.sendCommand({ cmd: 'EmbodyStiforp' });
            toolResult = JSON.stringify(res);
          } catch (err) {
            toolResult = `Error: ${err.message}`;
          }
          actions.push({ type: 'kernel_command', cmd: 'EmbodyStiforp' });
          break;
        }
        case 'spawn_soul': {
          try {
            const res = await kernel.sendCommand({
              cmd: 'SpawnSoul',
              name: toolCall.name || 'Newborn',
              race: toolCall.race || 'Human',
              x: 100, y: 100,
            });
            toolResult = JSON.stringify(res);
          } catch (err) {
            toolResult = `Error: ${err.message}`;
          }
          actions.push({ type: 'kernel_command', cmd: 'SpawnSoul' });
          break;
        }
        case 'search': {
          const sr = await webSearch(toolCall.query || '');
          toolResult = JSON.stringify(sr.results.slice(0, 3));
          actions.push({ type: 'search', query: toolCall.query });
          break;
        }
        case 'fetch': {
          const fr = await fetchURL(toolCall.url || '');
          if (fr.error) {
            toolResult = `Error: ${fr.error}`;
          } else {
            toolResult = await summarize(fr.text);
          }
          actions.push({ type: 'fetch', url: toolCall.url });
          break;
        }
        default:
          toolResult = `Unknown tool: ${toolCall.tool}`;
      }
      messages.push({ role: 'user', content: `Tool result: ${toolResult}` });
      continue;
    }

    // Plain text reply
    return { reply: content, actions };
  }

  return { reply: 'I could not complete that request. Please try again.', actions };
}

// ─── Session History ──────────────────────────────────────────────────────────

const sessions = new Map(); // sessionId → [{ role, content }]

function getHistory(sessionId) {
  if (!sessionId) return [];
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

function appendHistory(sessionId, role, content) {
  if (!sessionId) return;
  const h = getHistory(sessionId);
  h.push({ role, content });
  if (h.length > 40) h.splice(0, h.length - 40); // keep last 20 turns
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatStateReply(state) {
  if (!state) return 'No state available from kernel.';
  const lines = [
    `**${state.name || 'Stiforp'}** — Cycle ${state.cycle || state.cycle_count || '?'}`,
    `Emotion: ${state.emotion || state.affect?.valence || 'unknown'}`,
    `Inner voice: "${state.inner_voice || '...'}"`,
  ];
  if (state.current_goal) lines.push(`Goal: ${state.current_goal}`);
  if (state.sanctum_connected !== undefined) {
    lines.push(`Sanctum: ${state.sanctum_connected ? '🟢 connected' : '🔴 not connected'}`);
  }
  if (state.memories_count !== undefined) lines.push(`Memories: ${state.memories_count}`);
  if (state.autonomy_level !== undefined) {
    lines.push(`Autonomy: ${(state.autonomy_level * 100).toFixed(0)}%`);
  }
  if (Array.isArray(state.recent_memories) && state.recent_memories.length > 0) {
    lines.push(`\nRecent memories:\n${state.recent_memories.map((m) => `• ${m}`).join('\n')}`);
  }
  return lines.join('\n');
}

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// Serve the UI if jarvis-ui/index.html exists alongside the bridge
app.use(express.static(path.join(__dirname, '..', 'jarvis-ui')));

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    kernel_connected: kernel.connected,
    mode: LLM_MODE ? 'llm' : 'rule-based',
    llm_model: LLM_MODE ? OPENAI_MODEL : null,
    search_provider: SERPER_API_KEY ? 'serper' : 'duckduckgo',
    version: '1.1.0',
  });
});

app.get('/api/state', async (req, res) => {
  try {
    if (kernel.connected) {
      const result = await kernel.sendCommand({ cmd: 'GetState' });
      return res.json({ ok: true, state: result.state || result });
    } else if (kernel.latestState) {
      return res.json({ ok: true, state: kernel.latestState, stale: true });
    } else {
      return res.json({ ok: false, error: 'Kernel not connected and no cached state' });
    }
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body || {};
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'message is required' });
  }

  const trimmed = message.trim().slice(0, 2000); // limit message length
  const history = getHistory(sessionId);

  try {
    let result;
    if (LLM_MODE) {
      result = await handleLLMBacked(trimmed, history);
    } else {
      result = await handleRuleBased(trimmed);
    }

    appendHistory(sessionId, 'user', trimmed);
    appendHistory(sessionId, 'assistant', result.reply);

    res.json({ ok: true, reply: result.reply, actions: result.actions });
  } catch (err) {
    console.error('[chat] error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[express] unhandled error:', err);
  res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🤖 Jarvis Bridge running at http://0.0.0.0:${PORT}`);
  console.log(`   Mode: ${LLM_MODE ? `LLM (${OPENAI_MODEL})` : 'rule-based'}`);
  console.log(`   Kernel: ${KERNEL_HOST}:${KERNEL_PORT}`);
  console.log(`   Search: ${SERPER_API_KEY ? 'Serper.dev' : 'DuckDuckGo (no key)'}`);
  console.log(`   UI served at: http://0.0.0.0:${PORT}/`);
  console.log(`   Health: http://0.0.0.0:${PORT}/api/health\n`);
});

module.exports = { app, kernel }; // for testing
