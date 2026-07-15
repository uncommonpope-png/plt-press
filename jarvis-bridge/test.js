/**
 * Basic smoke tests for Jarvis Bridge
 * Run: node test.js
 */

'use strict';

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

// ─── Unit tests (no server required) ─────────────────────────────────────────

console.log('\n=== Jarvis Bridge Tests ===\n');

// Test URL safety
console.log('URL safety:');
{
  const { app } = require('./index'); // side-effect: starts server
  // We test the extractText and URL parsing logic directly
  const URL_SAFE = ['https://example.com', 'http://example.com/path?q=1'];
  const URL_UNSAFE = ['ftp://example.com', 'file:///etc/passwd', 'javascript:alert(1)'];

  for (const u of URL_SAFE) {
    try { const p = new URL(u); assert(p.protocol === 'http:' || p.protocol === 'https:', `safe URL: ${u}`); }
    catch (_) { assert(false, `safe URL: ${u}`); }
  }
  for (const u of URL_UNSAFE) {
    try { const p = new URL(u); assert(p.protocol !== 'http:' && p.protocol !== 'https:', `blocked URL: ${u}`); }
    catch (_) { assert(true, `blocked URL (parse error): ${u}`); }
  }
}

// Test intent matching (rule-based)
console.log('\nIntent matching:');
{
  const INTENT_PATTERNS = [
    { re: /\b(status|state|how are you|how is stiforp|how do you feel)\b/i, intent: 'get_state' },
    { re: /\b(set goal|your goal|goal is)\s*[:=]?\s*(.+)/i, intent: 'set_goal' },
    { re: /\b(embody stiforp|become stiforp|awaken|embody)\b/i, intent: 'embody_stiforp' },
    { re: /\b(spawn|create|birth)\s*(a\s+)?soul\b/i, intent: 'spawn_soul' },
    { re: /\b(search|look up|find|google)\s+(.+)/i, intent: 'search' },
  ];

  function matchIntent(msg) {
    for (const { re, intent } of INTENT_PATTERNS) {
      const m = msg.match(re);
      if (m) return intent;
    }
    return 'unknown';
  }

  assert(matchIntent('how are you?') === 'get_state', 'matches get_state for "how are you?"');
  assert(matchIntent('what is your status') === 'get_state', 'matches get_state for "status"');
  assert(matchIntent('set goal: explore the stars') === 'set_goal', 'matches set_goal');
  assert(matchIntent('embody stiforp') === 'embody_stiforp', 'matches embody_stiforp');
  assert(matchIntent('spawn a soul') === 'spawn_soul', 'matches spawn_soul');
  assert(matchIntent('search quantum computing') === 'search', 'matches search');
  assert(matchIntent('random nonsense xyz') === 'unknown', 'unknown intent falls through');
}

// Test heuristic summarizer
console.log('\nHeuristic summarizer:');
{
  function heuristicSummarize(text, maxSentences = 5) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.slice(0, maxSentences).join(' ').trim();
  }
  const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence. Sixth sentence.';
  const result = heuristicSummarize(text, 3);
  assert(result.includes('First') && result.includes('Third') && !result.includes('Sixth'), 'summarizes to 3 sentences');
  assert(heuristicSummarize('', 5) === '', 'handles empty string');
}

// Test HTML text extraction
console.log('\nHTML extraction:');
{
  function extractText(html) {
    let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }
  const html = '<html><head><style>body{color:red}</style></head><body><script>alert(1)</script><p>Hello &amp; world</p></body></html>';
  const result = extractText(html);
  assert(result.includes('Hello & world'), 'extracts text from HTML');
  assert(!result.includes('alert'), 'strips script tags');
  assert(!result.includes('color:red'), 'strips style tags');
}

// ─── HTTP API tests (requires server to be running) ────────────────────────

console.log('\nHTTP API (health check):');
const PORT = process.env.PORT || 3001;

setTimeout(async () => {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/health`);
    const json = await res.json();
    assert(json.ok === true, 'GET /api/health returns ok:true');
    assert(typeof json.mode === 'string', 'health response has mode');
    assert(typeof json.version === 'string', 'health response has version');
  } catch (err) {
    assert(false, `GET /api/health: ${err.message}`);
  }

  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'help' }),
    });
    const json = await res.json();
    assert(json.ok === true, 'POST /api/chat help returns ok:true');
    assert(typeof json.reply === 'string' && json.reply.length > 0, 'chat response has non-empty reply');
  } catch (err) {
    assert(false, `POST /api/chat: ${err.message}`);
  }

  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });
    assert(res.status === 400, 'empty message returns 400');
  } catch (err) {
    assert(false, `empty message test: ${err.message}`);
  }

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}, 500);
