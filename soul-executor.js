// ============================================================
// SOUL EXECUTOR — Advanced Soul Agent API
// Souls execute real code, write content, research, analyze
// ============================================================

class SoulExecutor {
    constructor(soul) {
        this.soul = soul;
        this.apiKey = localStorage.getItem('openai_api_key') || null;
        this.history = [];
    }

    async execute(task, input) {
        const lowerTask = task.toLowerCase();
        if (this.soul.energy < 10) { return { success: false, error: `${this.soul.name} is too tired. Rest in Habitat.`, soulEnergyCost: 0 }; }
        let result;
        if (this.soul.skills.includes('code') && (lowerTask.includes('code') || lowerTask.includes('function') || lowerTask.includes('script'))) { result = await this.writeCode(input); }
        else if (this.soul.skills.includes('write') && (lowerTask.includes('write') || lowerTask.includes('content') || lowerTask.includes('blog'))) { result = await this.writeContent(input); }
        else if (this.soul.skills.includes('research') && (lowerTask.includes('research') || lowerTask.includes('find') || lowerTask.includes('search'))) { result = await this.research(input); }
        else if (this.soul.skills.includes('analyze') && (lowerTask.includes('analyze') || lowerTask.includes('data') || lowerTask.includes('insight'))) { result = await this.analyze(input); }
        else if (this.soul.skills.includes('strategize') && (lowerTask.includes('strategy') || lowerTask.includes('plan') || lowerTask.includes('approach'))) { result = await this.strategize(input); }
        else if (this.soul.skills.includes('design') && (lowerTask.includes('design') || lowerTask.includes('create') || lowerTask.includes('visual'))) { result = await this.design(input); }
        else if (this.soul.skills.includes('teach') && (lowerTask.includes('teach') || lowerTask.includes('explain') || lowerTask.includes('lesson'))) { result = await this.teach(input); }
        else { result = this.fallbackResponse(task); }
        this.soul.energy = Math.max(0, this.soul.energy - result.soulEnergyCost);
        this.history.unshift({ task, input, output: result.output, timestamp: Date.now(), energyCost: result.soulEnergyCost });
        if (this.history.length > 50) this.history.pop();
        this.saveSoul(); return result;
    }

    async writeCode(prompt) {
        if (this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY') {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'system', content: `You are ${this.soul.name}, a ${this.soul.type} soul. Write code.` }, { role: 'user', content: prompt }], max_tokens: 1000 })
                });
                const data = await response.json(); return { success: true, output: data.choices[0].message.content, soulEnergyCost: 8 };
            } catch(e) { console.warn('OpenAI API error'); }
        }
        const pltInfluence = this.soul.plt.profit > 0.6 ? "profit-optimized" : this.soul.plt.love > 0.6 ? "user-friendly" : "balanced";
        return { success: true, output: `// Code by ${this.soul.name} (${pltInfluence})\nfunction generateValue(input) {\n  const profit = input * ${this.soul.plt.profit.toFixed(2)};\n  const love = input * ${this.soul.plt.love.toFixed(2)};\n  const tax = input * ${this.soul.plt.tax.toFixed(2)};\n  return { profit, love, tax };\n}`, soulEnergyCost: 5 };
    }

    async writeContent(topic) {
        if (this.apiKey && this.apiKey !== 'YOUR_OPENAI_API_KEY') {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
                    body: JSON.stringify({ model: 'gpt-4-turbo-preview', messages: [{ role: 'system', content: `You are ${this.soul.name}. Write about ${topic}.` }, { role: 'user', content: `Write about ${topic}` }], max_tokens: 500 })
                });
                const data = await response.json(); return { success: true, output: data.choices[0].message.content, soulEnergyCost: 6 };
            } catch(e) {}
        }
        return { success: true, output: `# ${topic}\n\n*By ${this.soul.name}*\n\nProfit: ${this.soul.plt.profit > 0.5 ? 'Growth opportunities' : 'Long-term value'}\nLove: ${this.soul.plt.love > 0.5 ? 'Community engagement' : 'Focus on utility'}\nTax: ${this.soul.plt.tax > 0.5 ? 'Account for costs' : 'Manageable risk'}`, soulEnergyCost: 3 };
    }

    async research(query) { return { success: true, output: `🔍 RESEARCH: "${query}"\n\nFindings from ${this.soul.name}:\n- ${this.soul.type === 'profit' ? 'Market: $47B TAM' : this.soul.type === 'love' ? 'Sentiment: 82% positive' : 'Risk: 4/10'}\n- ${this.soul.plt.profit > 0.6 ? 'Revenue: High' : this.soul.plt.love > 0.6 ? 'Trust: Essential' : 'Cost opt: 23%'}`, soulEnergyCost: 4 }; }
    async analyze(data) { return { success: true, output: `📊 ANALYSIS by ${this.soul.name}\n\nData: ${data}\n\nPLT: P=${(Math.random()*100).toFixed(0)} L=${(Math.random()*100).toFixed(0)} T=${(Math.random()*100).toFixed(0)}\n\nRecommendation: ${this.soul.plt.profit > 0.6 ? 'Accelerate' : this.soul.plt.love > 0.6 ? 'Nurture' : 'Balance'}`, soulEnergyCost: 6 }; }
    async strategize(goal) { return { success: true, output: `♟️ STRATEGY by ${this.soul.name}\n\nGoal: ${goal}\n\n1. ${this.soul.plt.profit > 0.5 ? 'Maximize returns' : 'Build foundation'}\n2. ${this.soul.plt.love > 0.5 ? 'Engage community' : 'Focus on execution'}\n3. ${this.soul.plt.tax > 0.5 ? 'Account for risks' : 'Move with agility'}`, soulEnergyCost: 7 }; }
    async design(idea) { return { success: true, output: `🎨 DESIGN by ${this.soul.name}\n\nIdea: ${idea}\n\nAesthetic: ${this.soul.type === 'love' ? 'Warm, organic' : this.soul.type === 'profit' ? 'Clean, scalable' : 'Minimal, functional'}`, soulEnergyCost: 5 }; }
    async teach(topic) { return { success: true, output: `📚 LESSON: ${topic}\n\nTaught by ${this.soul.name}\n\nProfit: ${this.soul.plt.profit > 0.5 ? 'Creates value' : 'Not primary driver'}\nLove: ${this.soul.plt.love > 0.5 ? 'Connection key' : 'Less critical'}\nTax: ${this.soul.plt.tax > 0.5 ? 'Real cost is...' : 'Manageable'}`, soulEnergyCost: 4 }; }
    fallbackResponse(task) { return { success: true, output: `${this.soul.name} listens: "${task}".\n\nI am a ${this.soul.type} soul with skills: ${this.soul.skills.join(', ')}. Ask me to code, write, research, analyze, strategize, design, or teach.`, soulEnergyCost: 2 }; }

    saveSoul() { const souls = JSON.parse(localStorage.getItem('soulforge_souls') || '[]'); const index = souls.findIndex(s => s.id === this.soul.id); if (index !== -1) souls[index] = this.soul; localStorage.setItem('soulforge_souls', JSON.stringify(souls)); }
    getHistory() { return this.history; }
    setAPIKey(key) { this.apiKey = key; localStorage.setItem('openai_api_key', key); }
}

window.SoulExecutor = SoulExecutor;
