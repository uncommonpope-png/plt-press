/**
 * SOULVERSE CANONICAL ENGINE
 * /ui/hud.js
 * Main HUD: health bars, PLT display, minimap, action wheel
 */

export class HUD {
  constructor(engine) {
    this.engine = engine;
    this.elements = {};
  }

  init(container) {
    this.container = container;
    this.createPLTDisplay();
    this.createHealthBar();
    this.createMinimap();
    this.createActionWheel();
  }

  createPLTDisplay() {
    const div = document.createElement('div');
    div.id = 'plt-display';
    div.innerHTML = `
      <div class="plt-row profit">💰 <span id="plt-profit">0</span></div>
      <div class="plt-row love">❤️ <span id="plt-love">0</span></div>
      <div class="plt-row tax">📜 <span id="plt-tax">0</span></div>
    `;
    this.container.appendChild(div);
    this.elements.plt = div;
  }

  createHealthBar() {
    const div = document.createElement('div');
    div.id = 'health-bar';
    div.innerHTML = `<div id="health-fill"></div><span id="health-text">100/100</span>`;
    this.container.appendChild(div);
    this.elements.health = div;
  }

  createMinimap() {
    const div = document.createElement('div');
    div.id = 'minimap';
    div.innerHTML = '<canvas id="minimap-canvas"></canvas>';
    this.container.appendChild(div);
    this.elements.minimap = div;
  }

  createActionWheel() {
    const div = document.createElement('div');
    div.id = 'action-wheel';
    div.className = 'hidden';
    div.innerHTML = `
      <div class="wheel-item" data-action="attack">⚔️ Attack</div>
      <div class="wheel-item" data-action="build">🔨 Build</div>
      <div class="wheel-item" data-action="talk">💬 Talk</div>
      <div class="wheel-item" data-action="trade">💰 Trade</div>
    `;
    this.container.appendChild(div);
    this.elements.wheel = div;
  }

  update(player) {
    if (!player) return;
    
    document.getElementById('plt-profit').textContent = Math.floor(player.plt?.profit || 0);
    document.getElementById('plt-love').textContent = Math.floor(player.plt?.love || 0);
    document.getElementById('plt-tax').textContent = Math.floor(player.plt?.tax || 0);
    
    const healthPct = ((player.health || 0) / (player.maxHealth || 100)) * 100;
    document.getElementById('health-fill').style.width = healthPct + '%';
    document.getElementById('health-text').textContent = 
      `${Math.floor(player.health || 0)}/${Math.floor(player.maxHealth || 100)}`;
  }

  showWheel() { this.elements.wheel.classList.remove('hidden'); }
  hideWheel() { this.elements.wheel.classList.add('hidden'); }
}