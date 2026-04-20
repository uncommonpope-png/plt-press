/**
 * SOULVERSE CANONICAL ENGINE
 * /ui/soul-ui.js
 * Soul collection interface, soul details, capture minigame
 */

export class SoulUI {
  constructor(engine) {
    this.engine = engine;
  }

  init(container) {
    this.container = container;
    this.createSoulPanel();
    this.createCaptureUI();
  }

  createSoulPanel() {
    const div = document.createElement('div');
    div.id = 'soul-panel';
    div.className = 'hidden';
    div.innerHTML = `
      <h3>👻 Soul Collection</h3>
      <div id="soul-list"></div>
      <div id="soul-details"></div>
    `;
    this.container.appendChild(div);
  }

  createCaptureUI() {
    const div = document.createElement('div');
    div.id = 'capture-ui';
    div.className = 'hidden';
    div.innerHTML = `
      <div class="capture-ring"></div>
      <div class="capture-timer"></div>
      <div class="capture-instruction">Hold steady to capture!</div>
    `;
    this.container.appendChild(div);
  }

  showSoulPanel() { document.getElementById('soul-panel').classList.remove('hidden'); }
  hideSoulPanel() { document.getElementById('soul-panel').classList.add('hidden'); }
  showCapture() { document.getElementById('capture-ui').classList.remove('hidden'); }
  hideCapture() { document.getElementById('capture-ui').classList.add('hidden'); }

  updateSoulList(souls) {
    const list = document.getElementById('soul-list');
    if (!list) return;
    list.innerHTML = souls.map(s => `
      <div class="soul-item" data-id="${s.id}">
        <span class="soul-color" style="background:${s.color}"></span>
        <span class="soul-name">${s.name}</span>
        <span class="soul-type">${s.soulType}</span>
      </div>
    `).join('');
  }
}