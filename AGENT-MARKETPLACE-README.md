# 🌌 SOULVERSE AGENT MARKETPLACE

## The Game That Pays You Back

**Soulverse** is not just a game. It's a **platform** where you buy the game, connect your AI agents with your own API keys and GitHub access, and earn money while you play.

---

## 🎮 WHAT YOU GET

### 1. Full Soulverse RTS Game
- Build your soul civilization
- Gather resources (Profit, Love, Tax)
- Construct buildings
- Breed souls with genetics
- Battle in arena with combo system
- Complete heist missions
- Manage villages and pantheon

### 2. AI Agent Platform
Connect your own AI agents that do **real work**:

| Agent | What It Does | Permission Required |
|-------|--------------|---------------------|
| 💻 Code Agent | Writes code, commits to GitHub | Code access |
| 📝 Content Agent | Creates blogs, social posts, copy | Content creation |
| 📈 Trading Agent | Market analysis, executes trades | Trading access |
| 🔬 Research Agent | Web research, data collection, reports | Research access |
| 📱 Social Media Agent | Manages social accounts, posting | Social media access |
| 🚀 Deploy Agent | Deploys apps to cloud platforms | Deploy access |

---

## 💰 HOW IT WORKS

### Step 1: Purchase the Game ($49.99 one-time)
- Pay via Crypto (BTC, ETH, USDT), Stripe, or PayPal
- Unlock the full Soulverse game
- Get access to the Agent Marketplace
- All 6 agent types included FREE

### Step 2: Connect Your API Keys
You bring your own keys - you control everything:

```
✅ OpenAI API Key (for GPT-4, GPT-3.5)
✅ Anthropic API Key (for Claude)
✅ Ollama Local AI (free, runs on your machine)
✅ GitHub Personal Access Token
✅ Stripe API Key (for receiving payments)
```

### Step 3: Connect Your GitHub
- OAuth authentication
- Select which repositories agents can access
- Grant specific permissions (read, write, commit)
- Revoke access anytime

### Step 4: Set Permissions
Control exactly what agents can do:

- [ ] Write Code to GitHub
- [ ] Deploy Applications
- [ ] Execute Trades (Crypto/Stocks)
- [ ] Create & Publish Content
- [ ] Send Emails
- [ ] Post to Social Media
- [ ] Web Research & Data Collection

### Step 5: Agents Work & You Earn
- Assign tasks to your agents
- Agents complete real work using your API keys
- You earn money for completed work
- Withdraw earnings anytime via Stripe/crypto

---

## 🛠️ TECHNICAL SETUP

### Requirements

**Minimum:**
- Any modern computer (Windows, Mac, Linux)
- 4GB RAM
- Internet connection
- Web browser (Chrome, Firefox, Edge)

**For Local AI (Ollama):**
- 8GB RAM recommended
- 10GB free disk space
- No GPU required (but helps)

### Installation

#### Option A: Run Locally (Recommended)

```bash
# 1. Clone or download Soulverse
cd ~/soulverse

# 2. Install Python dependencies
pip install aiohttp

# 3. Start Ollama (for free local AI)
ollama serve
ollama pull qwen2.5:0.5b

# 4. Start the Agent Platform server
python3 agent-platform-server.py

# 5. Open in browser
# Navigate to: http://localhost:8765
# Or open: SOULVERSE-AGENT-MARKETPLACE.html
```

#### Option B: Deploy to Cloud

```bash
# Deploy to Oracle Cloud / AWS / GCP
# See: CLOUD-DEPLOYMENT-GUIDE.md
```

---

## 📁 FILE STRUCTURE

```
soulverse/
├── SOULVERSE-AGENT-MARKETPLACE.html   # Main marketplace UI
├── SOULVERSE-FUSION-MASTER.html       # Full RTS game
├── agent-platform-server.py           # Backend server
├── AGENT-MARKETPLACE-README.md        # This file
├── agent-platform-state.json          # User state (auto-generated)
└── agent-work-log.json                # Work logs (auto-generated)
```

---

## 🔐 SECURITY & PRIVACY

### Your Data Stays Yours
- **API Keys**: Stored locally, encrypted, never sent to us
- **GitHub Token**: Only used for your repositories
- **Work History**: Stored on your machine
- **Earnings**: Paid directly to your Stripe/crypto wallet

### Permissions Are Granular
- Enable/disable each permission individually
- Revoke GitHub access anytime
- Agents only work when you activate them
- Full audit log of all agent actions

### Open Source
- All code is visible and auditable
- No hidden processes
- No telemetry
- No data collection

---

## 💸 EARNINGS MODEL

### How You Earn

| Task Type | Base Rate | Example Earnings |
|-----------|-----------|------------------|
| Code Generation | $0.50 + $0.01/100 chars | 500 char commit = $5.50 |
| Content Creation | $0.50 + $0.01/100 chars | 1000 char blog = $10.50 |
| Research Report | $1.00 + bonus | Comprehensive report = $15-50 |
| Deployment | $0.50 per deploy | 10 deploys = $5.00 |
| Trading | % of profits | 10% of trading gains |

### Withdrawal Options
- **Stripe**: Direct to bank account (1-3 days)
- **Crypto**: BTC, ETH, USDT (instant)
- **PayPal**: 2-5 business days

### Minimum Withdrawal
- $10.00 for Stripe/PayPal
- $5.00 for Crypto

---

## 🎮 GAME FEATURES

### RTS Gameplay
- **Resource Management**: Profit, Love, Tax, Gems
- **Building System**: Town Hall, Forge, Market, Barracks, Arena, Breeding, Vault
- **Unit Control**: Select, move, attack, gather with right-click
- **Tech Tree**: Unlock upgrades and new buildings

### Soul Breeding
- **Genetics**: IVs, natures, egg groups
- **Shiny Hunting**: 1% base chance, increases with breeding
- **Inheritance**: Stats, levels, traits pass to offspring

### Arena Combat
- **Combo System**: Chain attacks for bonus damage
- **Fatalities**: 10+ hit combos trigger fatality
- **Leveling**: Gain XP, level up, increase damage
- **Battle Log**: Track all combat actions

### Economy
- **Heist Missions**: Risk vs reward gameplay
- **Village System**: Shared storage, community
- **Pantheon**: Gods that influence your realm
- **Trading**: Resource exchange optimization

---

## 🤖 AGENT CAPABILITIES

### Code Agent
```
Capabilities:
- Generate code from descriptions
- Review and refactor existing code
- Commit to GitHub repositories
- Fix bugs automatically
- Write tests

Example Tasks:
"Create a Python function that sorts a list"
"Fix the bug in src/utils.py"
"Add unit tests for the login module"
```

### Content Agent
```
Capabilities:
- Write blog posts
- Create social media content
- Generate marketing copy
- SEO optimization
- Email newsletters

Example Tasks:
"Write a 1000-word blog post about AI"
"Create 5 tweets about my new product"
"Write landing page copy for my app"
```

### Research Agent
```
Capabilities:
- Web scraping and data collection
- Trend analysis
- Competitor research
- Report generation
- Market analysis

Example Tasks:
"Research AI trends in 2026"
"Find top 10 competitors in my niche"
"Create a report on crypto market"
```

### Deploy Agent
```
Capabilities:
- GitHub Pages deployment
- Vercel/Netlify integration
- CI/CD pipeline setup
- Cloud deployment (AWS, GCP, Azure)
- Monitoring setup

Example Tasks:
"Deploy my website to GitHub Pages"
"Set up automatic deployments"
"Monitor my application health"
```

---

## 🔧 API INTEGRATION

### Supported AI Providers

#### Ollama (Free, Local)
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Start server
ollama serve

# Pull model
ollama pull qwen2.5:0.5b

# Configure in Soulverse
URL: http://localhost:11434
```

#### OpenAI (Paid)
```
Get API key: https://platform.openai.com/api-keys
Models: GPT-4, GPT-3.5-turbo
Pricing: Pay per token usage
```

#### Anthropic (Paid)
```
Get API key: https://console.anthropic.com/
Models: Claude-3, Claude-2
Pricing: Pay per token usage
```

### GitHub Integration

1. **Create Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Scopes: `repo`, `workflow`, `write:packages`
   - Copy token

2. **Connect in Soulverse**:
   - Go to API Keys tab
   - Paste GitHub token
   - Click "Connect GitHub"
   - Select repositories

---

## 📊 DASHBOARD FEATURES

### Real-Time Stats
- Active agents count
- Current earnings (pending + total)
- Work completion rate
- API connection status

### Work Log
- Timestamp of all agent actions
- Success/failure status
- Task descriptions
- Output previews

### Earnings Tracker
- Total earned (all time)
- Pending withdrawal
- Earnings history
- Withdrawal records

---

## 🚀 QUICK START GUIDE

### 1. First Time Setup (10 minutes)

```bash
# Install dependencies
pip install aiohttp

# Start Ollama for free AI
ollama serve &
ollama pull qwen2.5:0.5b

# Start Agent Platform
python3 agent-platform-server.py
```

### 2. Purchase Game

1. Open `SOULVERSE-AGENT-MARKETPLACE.html` in browser
2. Click "BUY NOW"
3. Complete payment (test mode enabled for now)
4. Dashboard unlocks

### 3. Configure API Keys

1. Go to "API Keys" tab
2. Enter Ollama URL: `http://localhost:11434`
3. (Optional) Add OpenAI/Anthropic keys
4. Add GitHub token
5. Click "Test All Connections"

### 4. Connect GitHub

1. Go to "GitHub" tab
2. Click "Connect GitHub"
3. Select repositories
4. Grant permissions

### 5. Set Permissions

1. Go to "Permissions" tab
2. Enable/disable each permission
3. Click "Save Permissions"

### 6. Activate Agents

1. Go to "My Agents" tab
2. Click "Activate" on agents
3. Click "Configure" to assign tasks
4. Watch them work in "Work Log"

### 7. Launch Game

1. Go to "Launch Game" tab
2. Click "LAUNCH SOULVERSE"
3. Play while agents work!

---

## 🎯 EXAMPLE WORKFLOWS

### Workflow 1: Automated Blog Creation

```
1. Activate Content Agent
2. Task: "Write 5 blog posts about AI trends"
3. Agent generates content using your API keys
4. Review in Work Log
5. Publish to your blog
6. Earn $50 for content creation
```

### Workflow 2: GitHub Code Commits

```
1. Activate Code Agent
2. Task: "Create utility functions for my project"
3. Select target repository
4. Agent writes code, commits to GitHub
5. Review commit in your repo
6. Earn $10-50 per commit
```

### Workflow 3: Market Research

```
1. Activate Research Agent
2. Task: "Research crypto market trends"
3. Agent collects data, creates report
4. Use insights for trading
5. Earn $20-100 per report
```

---

## 🆘 TROUBLESHOOTING

### Server Won't Start
```bash
# Check Python version (need 3.7+)
python3 --version

# Install dependencies
pip install aiohttp

# Check if port is in use
lsof -i :8765

# Try different port
# Edit agent-platform-server.py, change PORT = 8765
```

### Ollama Connection Failed
```bash
# Check if Ollama is running
ollama list

# Restart Ollama
ollama serve

# Check URL in API Keys tab
# Should be: http://localhost:11434
```

### GitHub Connection Failed
```bash
# Verify token is valid
# Check token has correct scopes
# Try regenerating token

# Test with curl:
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### Agents Not Working
```
1. Check API keys are configured
2. Check permissions are enabled
3. Check agent is activated (not offline)
4. Check Work Log for errors
5. Restart server if needed
```

---

## 📞 SUPPORT

### Documentation
- `AGENT-MARKETPLACE-README.md` - This file
- `SOULVERSE-FUSION-MASTER.html` - Game code
- `agent-platform-server.py` - Backend code

### Community
- Telegram: [Your Telegram Link]
- Discord: [Your Discord Link]
- GitHub Issues: [Your Repo Issues]

### Contact
- Email: [Your Email]
- Twitter: [Your Twitter]

---

## 📜 LICENSE

**Soulverse Agent Platform**

- Personal Use: ✅ Allowed
- Commercial Use: ✅ Allowed (with purchase)
- Modification: ✅ Allowed
- Distribution: ❌ Not allowed
- Resale: ❌ Not allowed

One purchase = One user license
Multiple users need multiple licenses

---

## 🎉 READY TO START?

```bash
# 1. Start the server
python3 agent-platform-server.py

# 2. Open in browser
# http://localhost:8765

# 3. Purchase, configure, earn!
```

---

**Welcome to the Soulverse. Where gaming meets productivity. 🌌**

*Your agents work. You play. Everyone wins.*
