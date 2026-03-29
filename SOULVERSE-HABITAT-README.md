# 🌍 SOULVERSE HABITAT

**A Living World for Customers & Agents — Not a Game**

---

## 🎯 WHAT IS THIS?

Soulverse Habitat is a **persistent 3D world** where your customers and AI agents coexist, interact, and work together. It's a living ecosystem, not a game.

### Key Features:
- ✅ **3D Persistent World** — Time passes, entities live on even when you're away
- ✅ **Customer Management** — Add real customers, track their state
- ✅ **Agent Workforce** — Deploy AI agents to perform real tasks
- ✅ **Live Conversations** — Entities talk to each other and to you
- ✅ **Task Execution** — Agents can write code, generate content, do research
- ✅ **Village & Society** — Buildings, relationships, community
- ✅ **Resource System** — Profit, Love, Tax economy
- ✅ **Time Persistence** — World continues while you're offline

---

## 🚀 HOW TO RUN

### Local:
```bash
# Open in browser
open plt-press/SOULVERSE-HABITAT.html

# Or serve with Python
cd plt-press && python3 -m http.server 8000
# Visit: http://localhost:8000/SOULVERSE-HABITAT.html
```

### GitHub Pages (Live URL):
```
https://uncommonpope-png.github.io/plt-press/SOULVERSE-HABITAT.html
```

---

## 🎮 CONTROLS

### Navigation:
- **Left Click + Drag** — Rotate camera
- **Right Click + Drag** — Pan camera
- **Scroll** — Zoom in/out
- **Click on Entity** — Select customer or agent

### UI Panels:
- **👥 Customers** — View and add customers
- **🤖 Agents** — View agents, assign tasks
- **📋 Tasks** — See active/completed tasks
- **🏘️ Village** — Community overview
- **⚙️ Settings** — API keys for agents

---

## 👥 ADD CUSTOMERS

1. Click **👥 Customers** button
2. Click **+ Add Customer**
3. Enter:
   - Name (required)
   - Type: Profit/Love/Tax focused
   - Email (optional)
4. Click **Add Customer**

Customer appears in the 3D world as a blue orb.

---

## 🤖 DEPLOY AGENTS

1. Click **🤖 Agents** button
2. Click **+ Deploy Agent**
3. Choose:
   - Type: Code/Content/Research/Automation
   - Name
   - Cost: 200 Profit resources
4. Click **Deploy Agent**

Agent appears in the 3D world as a green orb.

---

## 📋 ASSIGN TASKS

Agents can perform real work:

### Task Types:
- **💻 Write Code** — Generate code snippets
- **📝 Generate Content** — Write articles, posts
- **🔬 Research** — Analyze data, find insights
- **⚙️ Automation** — Build workflows
- **GitHub: Create File** — Commit code to repo
- **GitHub: Create Issue** — Create GitHub issues

### To Assign:
1. Open **🤖 Agents** panel
2. Click **📋 Assign Task** on an agent
3. Fill in task description
4. Click **Execute Task**

Agent status changes to "working", then "idle" when complete.

---

## ⚙️ API SETUP

For agents to perform real AI tasks:

1. Click **⚙️ Settings**
2. Enter:
   - **OpenAI API Key** (for AI capabilities)
   - **GitHub Token** (optional, for GitHub integration)
   - **GitHub Repo** (owner/repo format)
3. Click **Save Settings**

Keys are stored locally in your browser. Never sent to our servers.

---

## 🌍 WORLD MECHANICS

### Time System:
- 1 real minute = 1 game hour
- Day/night cycle affects entity behavior
- World continues when you're offline

### Entity Needs:
- **Energy** — Decreases over time, regenerates when resting
- **Mood** — Changes based on energy level
- **Conversations** — Entities auto-chat when idle

### Resources:
- **💰 Profit** — Used to deploy agents
- **❤️ Love** — Relationship building
- **⚖️ Tax** — Compliance & balance

---

## 💬 CONVERSATIONS

Entities automatically converse:
- Customer ↔ Customer
- Agent ↔ Agent
- Customer ↔ Agent
- You ↔ Everyone (use input box at bottom)

Chat bubbles appear above entities in the 3D world.

---

## 🏘️ VILLAGE

The village panel shows:
- Current day & time
- Realm energy level
- Total inhabitants
- Building list
- Recent conversations

Buildings include:
- **🏛️ Town Hall** — Resource drop-off
- **🏠 Homes** — Customer residences
- **🏪 Market** — Trade hub
- **🔧 Workshop** — Agent workspace

---

## 💾 SAVE SYSTEM

World auto-saves every 30 seconds to `localStorage`:
- All entities (position, energy, mood)
- Buildings
- Resources
- Time state
- Settings

**Key:** `soulverse_habitat`

To reset: Clear browser localStorage or run:
```javascript
localStorage.removeItem('soulverse_habitat');
location.reload();
```

---

## 🔧 CUSTOMIZATION

### Add More Entity Types:
Edit the `entities` array in the code:
```javascript
{
    id: 'cust_X',
    name: 'New Customer',
    type: 'customer',
    subtype: 'profit', // or 'love', 'tax'
    energy: 100,
    x: 0, z: 0, // position
    mood: 'happy',
    plt: { profit: 0.5, love: 0.5, tax: 0.5 }
}
```

### Add Agent Task Types:
Edit the `taskType` dropdown and `executeTask()` function.

### Change World Appearance:
Modify the `createWorld()` function:
- Ground color
- Tree count
- Building styles
- Lighting

---

## 🎨 ENTITY COLORS

- **Blue Orb** (0x88aaff) — Customer
- **Green Orb** (0x88ff88) — Agent
- **Orange** (0xffaa66) — Buildings
- **Brown/Green** — Trees

---

## 📊 TECHNICAL SPECS

- **Engine:** Three.js r128
- **Storage:** localStorage (browser)
- **API:** OpenAI (optional)
- **GitHub:** Optional integration
- **Responsive:** Mobile & desktop
- **Performance:** ~60 FPS on modern devices

---

## 🐛 KNOWN LIMITATIONS

1. **Name Labels** — Simplified (no floating labels, use selection instead)
2. **Task Execution** — Simulated without API key
3. **Multiplayer** — Single user only (local storage)
4. **Persistence** — Browser-specific (won't sync across devices)

---

## 🔮 FUTURE ENHANCEMENTS

- [ ] Cloud sync (multi-device)
- [ ] Real OpenAI integration
- [ ] GitHub webhook support
- [ ] Customer analytics dashboard
- [ ] Agent performance metrics
- [ ] Export/import world data
- [ ] Custom building placement
- [ ] Entity relationships system

---

## 📜 LICENSE

Part of PLT Press Soulverse ecosystem.
**Profit · Love · Tax**

---

## 🙏 CREDITS

Created: March 29, 2026
Author: Craig Jones (PLT Press)
Inspired by: Soul World 3D, Living World, Agent Platform, Soul Society

---

## 📞 SUPPORT

For issues or feature requests, create a GitHub issue or contact PLT Press.

**⚡ SOULVERSE HABITAT — Where Customers & Agents Live Together ⚡**
