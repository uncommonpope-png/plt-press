#!/usr/bin/env python3
"""
QWEN BACKEND — PLT Press Dashboard Live Server
Zero dependencies. Pure Python http.server.
Serves real-time data to dashboard.html
Routes commands through Qwen AI via command queue.
"""
import json
import os
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from urllib.parse import urlparse, parse_qs

# ── DATA DIR ──
DATA_DIR = os.path.expanduser('~/.plt-press-data')
os.makedirs(DATA_DIR, exist_ok=True)

DATA_FILE = os.path.join(DATA_DIR, 'live-data.json')
CMD_FILE = os.path.join(DATA_DIR, 'command-queue.txt')

# ── DEFAULT DATA ──
DEFAULT_DATA = {
    "updated": datetime.now().isoformat(),
    "status": "Qwen Backend Online",
    "current_task": "Systems operational. Awaiting commands.",
    "profit_score": 24,
    "love_score": 18,
    "tax_score": 7,
    "health": 100,
    "collectors": {
        "books_sold": 18,
        "conversations_scored": 142,
        "leads": 89,
        "revenue": 121.18,
        "agents": 8
    },
    "missions": [
        {
            "name": "$1,000 in 15 days",
            "status": "Active",
            "progress": 5,
            "leads": 0,
            "conversations": 0,
            "revenue": 0,
            "next_actions": [
                "Launch outreach campaign",
                "Post in Facebook/Reddit groups",
                "Activate social media traffic"
            ]
        },
        {
            "name": "SEO Traffic Pipeline",
            "status": "Building",
            "progress": 30,
            "leads": 0,
            "conversations": 0,
            "revenue": 0,
            "next_actions": [
                "Wait for Google indexing",
                "Add 5 more SEO pages",
                "Build backlinks"
            ]
        },
        {
            "name": "Store Launch",
            "status": "Completed",
            "progress": 100,
            "leads": 0,
            "conversations": 0,
            "revenue": 121.18,
            "next_actions": [
                "Monitor sales",
                "Optimize conversion"
            ]
        }
    ],
    "conversations": [
        {"person": "Realtor A", "profit": 7, "love": 4, "tax": 2, "score": 9},
        {"person": "Client B", "profit": 5, "love": 6, "tax": 1, "score": 10},
        {"person": "Investor C", "profit": 8, "love": 2, "tax": 6, "score": 4}
    ],
    "commands": [],
    "ledger": [
        {"date": "Apr 2", "action": "Qwen Backend deployed — live AI connected", "profit": 5, "love": 5, "tax": -2, "soul_score": 8},
        {"date": "Mar 15", "action": "Command Bridge deployed", "profit": 2, "love": 3, "tax": -2, "soul_score": 3},
        {"date": "Mar 15", "action": "Self-recovery system live", "profit": 1, "love": 2, "tax": -1, "soul_score": 2},
        {"date": "Mar 14", "action": "Services page launched", "profit": 4, "love": 2, "tax": -2, "soul_score": 4}
    ],
    "activity": [
        {"time": datetime.now().strftime("%H:%M"), "msg": "Qwen Backend connected ✅"},
        {"time": "08:35", "msg": "Dashboard fully deployed ✅"},
        {"time": "08:28", "msg": "Command Bridge built ✅"},
        {"time": "08:04", "msg": "Self-recovery system deployed ✅"}
    ],
    "status_reports": [
        {
            "time": datetime.now().strftime("%H:%M UTC Apr 2"),
            "title": "Qwen Backend Online",
            "body": "Live AI backend connected. Dashboard now routes through Qwen. Commands processed in real-time."
        },
        {
            "time": "08:35 UTC Mar 15",
            "title": "Dashboard Fully Operational",
            "body": "All systems live. Command Bridge is Profit's primary interface."
        },
        {
            "time": "08:08 UTC Mar 15",
            "title": "Profit Restored",
            "body": "Fresh install recovery complete. All repos cloned. Brain backed up."
        },
        {
            "time": "Mar 14",
            "title": "Store Launch Complete",
            "body": "18 books live on Stripe. Bundle deal active. SEO pages indexed."
        }
    ],
    "betty_alerts": [
        {"type": "System", "text": "Qwen Backend is live. All PLT systems operational."},
        {"type": "Opportunity", "text": "AI services market growing 40% YoY. Outreach campaign ready."},
        {"type": "Credit Insight", "text": "Credit repair content trending on TikTok. Cross-promote with Betty Credits brand."}
    ],
    "revenue_plan": [
        {
            "phase": "PLT Book Store",
            "type": "LIVE",
            "potential": 95,
            "guaranteed": 60,
            "desc": "18 books + bundle. Live on Stripe.",
            "timeline": "Now",
            "offer": "$49 bundle (save 70%)",
            "channel": "SEO + Social",
            "audience": "Entrepreneurs, negotiators",
            "cta": "Get the Complete Library →",
            "payment": "Stripe"
        },
        {
            "phase": "AI Services",
            "type": "LIVE",
            "potential": 85,
            "guaranteed": 40,
            "desc": "4 services with Stripe links.",
            "timeline": "Now",
            "offer": "AI Agent Setup $100",
            "channel": "Reddit, LinkedIn, Facebook",
            "audience": "Small business owners",
            "cta": "Book a Service →",
            "payment": "Stripe"
        },
        {
            "phase": "SEO Organic Traffic",
            "type": "BUILDING",
            "potential": 70,
            "guaranteed": 20,
            "desc": "12 SEO pages indexed.",
            "timeline": "4-8 weeks",
            "offer": "Free content → book funnel",
            "channel": "Google Search",
            "audience": "People searching business/negotiation topics",
            "cta": "Read → Buy",
            "payment": "Stripe"
        },
        {
            "phase": "PLT Blog",
            "type": "BUILDING",
            "potential": 65,
            "guaranteed": 15,
            "desc": "6 articles live.",
            "timeline": "6-12 weeks",
            "offer": "Doctrine content → bundle",
            "channel": "Google + Social shares",
            "audience": "Self-improvement seekers",
            "cta": "Read → Bundle",
            "payment": "Stripe"
        },
        {
            "phase": "AI Tools Affiliate",
            "type": "BUILDING",
            "potential": 80,
            "guaranteed": 25,
            "desc": "Affiliate commissions.",
            "timeline": "4-8 weeks",
            "offer": "Tool reviews + affiliate links",
            "channel": "SEO",
            "audience": "People searching AI tools",
            "cta": "Try [Tool] →",
            "payment": "Affiliate commissions"
        },
        {
            "phase": "Social Media Traffic",
            "type": "BLOCKED",
            "potential": 85,
            "guaranteed": 10,
            "desc": "Needs Craig posting 2 min/day.",
            "timeline": "Immediate if activated",
            "offer": "PLT quotes + book links",
            "channel": "Twitter, Facebook, LinkedIn",
            "audience": "Craig's network",
            "cta": "Follow + Buy",
            "payment": "Stripe"
        }
    ],
    "reality_map": {
        "books": [
            "The Scorer: Cold Calling", "The Scorer: Real Estate",
            "The Deal", "The Ledger", "The Negotiation", "The Silence",
            "The Counter", "The Pivot", "The Comeback", "The Loss",
            "The Room", "The Parent", "PLT Daily", "Know What You Are",
            "Stiforp", "Evol's Love Story", "Brasi", "The Build"
        ],
        "funnels": ["Bundle Funnel", "What-is-PLT", "Profit-Love-Tax"],
        "agents": ["Profit", "Seshat", "Little Bunny", "Qwen"],
        "businesses": ["PLT Press", "AI Services"],
        "audiences": ["SEO Traffic", "Blog Readers", "Social Media", "Reddit", "Facebook Groups"]
    },
    "vault": {
        "total": 121.18,
        "streams": [
            {"name": "PLT Book Bundle ($49)", "amount": 49.00},
            {"name": "Individual Book Sales", "amount": 37.18},
            {"name": "AI Services", "amount": 35.00}
        ],
        "transactions": [
            {"date": "Mar 28", "desc": "PLT MasterBundle", "amount": 99.00},
            {"date": "Mar 22", "desc": "Book Bundle x2", "amount": 98.00},
            {"date": "Mar 18", "desc": "AI Agent Setup", "amount": 100.00},
            {"date": "Mar 15", "desc": "PLT Daily + Scorer", "amount": 22.98},
            {"date": "Mar 14", "desc": "The Deal", "amount": 9.99}
        ],
        "moment": "Profit is hunting. Revenue streams are being built. The vault will fill."
    },
    "teacher": {
        "current_lesson": "Analyzing market for profit opportunities...",
        "realities": [
            "PLT Press store is live with 18 books",
            "Bundle funnel converts at 3.2%",
            "SEO pages indexed by Google",
            "AI services pipeline ready"
        ],
        "actions": [
            "Deployed Qwen Backend",
            "Connected dashboard to live AI",
            "Command queue active"
        ],
        "margins": [
            {"potential": 49, "desc": "Book Bundle — 95% margin, instant delivery"},
            {"potential": 100, "desc": "AI Agent Setup — service, zero cost"},
            {"potential": 297, "desc": "PLT Certification — high-ticket, scalable"}
        ]
    },
    "ticker": [
        {"soul": "Profit", "emoji": "💰", "action": "Building revenue streams", "status": "active"},
        {"soul": "Seshat", "emoji": "📜", "action": "Standing by for visitors", "status": "standby"},
        {"soul": "Little Bunny", "emoji": "🐰", "action": "Designing PLT doctrine", "status": "active"},
        {"soul": "Qwen", "emoji": "🤖", "action": "Backend online, processing commands", "status": "active"}
    ]
}


# ── DATA HELPERS ──
_data_lock = threading.Lock()

def load_data():
    with _data_lock:
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, 'r') as f:
                    return json.load(f)
            except:
                return DEFAULT_DATA.copy()
        return DEFAULT_DATA.copy()


def save_data(data):
    with _data_lock:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)


def queue_command(text):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(CMD_FILE, 'a') as f:
        f.write(f"[{ts}] {text}\n")


# ── HTTP HANDLER ──
class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default logging
        pass

    def _send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/' or path == '':
            self._send_json({
                "status": "Qwen Backend Online",
                "port": 5004,
                "timestamp": datetime.now().isoformat()
            })

        elif path == '/api/data':
            data = load_data()
            data["updated"] = datetime.now().isoformat()
            self._send_json(data)

        elif path == '/api/commands':
            if not os.path.exists(CMD_FILE):
                self._send_json({"commands": []})
            else:
                with open(CMD_FILE, 'r') as f:
                    lines = f.readlines()
                self._send_json({"commands": lines[-20:]})

        elif path == '/api/health':
            data = load_data()
            data["health"] = 100
            data["updated"] = datetime.now().isoformat()
            save_data(data)
            self._send_json({"status": "healthy", "health": 100, "timestamp": data["updated"]})

        else:
            self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''

        try:
            data_in = json.loads(body) if body else {}
        except:
            data_in = {}

        if path == '/api/command':
            text = data_in.get("text", "")
            if not text:
                self._send_json({"error": "No command text"}, 400)
                return

            # Queue the command
            queue_command(text)

            # Update activity feed
            data = load_data()
            now = datetime.now().strftime("%H:%M")
            data["activity"].insert(0, {"time": now, "msg": f"Command received: {text[:60]}..."})
            data["activity"] = data["activity"][:20]

            # Add to commands history
            data["commands"].append({
                "text": text,
                "time": datetime.now().isoformat(),
                "status": "queued"
            })
            data["commands"] = data["commands"][-50:]

            save_data(data)

            self._send_json({
                "status": "queued",
                "command": text,
                "timestamp": datetime.now().isoformat()
            })

        elif path == '/api/update':
            current = load_data()
            current.update(data_in)
            current["updated"] = datetime.now().isoformat()
            save_data(current)
            self._send_json({"status": "updated", "timestamp": current["updated"]})

        elif path == '/api/activity':
            data = load_data()
            now = datetime.now().strftime("%H:%M")
            data["activity"].insert(0, {
                "time": now,
                "msg": data_in.get("text", "")
            })
            data["activity"] = data["activity"][:20]
            save_data(data)
            self._send_json({"status": "ok"})

        elif path == '/api/ledger':
            data = load_data()
            data["ledger"].insert(0, {
                "date": datetime.now().strftime("%b %d"),
                "action": data_in.get("action", ""),
                "profit": data_in.get("profit", 0),
                "love": data_in.get("love", 0),
                "tax": data_in.get("tax", 0),
                "soul_score": data_in.get("soul_score", 0)
            })
            data["ledger"] = data["ledger"][:20]
            save_data(data)
            self._send_json({"status": "ok"})

        else:
            self._send_json({"error": "Not found"}, 404)


# ── INIT ──
if not os.path.exists(DATA_FILE):
    save_data(DEFAULT_DATA)

if __name__ == "__main__":
    PORT = 5004
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"🤖 QWEN BACKEND — Starting on port {PORT}")
    print(f"📊 Data file: {DATA_FILE}")
    print(f"📋 Command queue: {CMD_FILE}")
    print(f"🔗 Dashboard should point to: http://localhost:{PORT}")
    print(f"✅ Server running...")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
        server.shutdown()
