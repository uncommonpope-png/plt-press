/**
 * /ui/combat-ui.js - Combat overlay
 */
export class CombatUI {
  init(container) {
    const div = document.createElement('div');
    div.id = 'combat-ui';
    div.className = 'hidden';
    div.innerHTML = `
      <div id="target-info"></div>
      <div id="combat-log"></div>
      <div id="skills-bar"></div>
    `;
    container.appendChild(div);
  }
  show() { document.getElementById('combat-ui').classList.remove('hidden'); }
  hide() { document.getElementById('combat-ui').classList.add('hidden'); }
  setTarget(entity) {
    document.getElementById('target-info').innerHTML = entity ? 
      `${entity.name} HP: ${entity.health}` : 'No target';
  }
  addLog(msg) {
    const log = document.getElementById('combat-log');
    log.innerHTML += `<div>${msg}</div>`;
    log.scrollTop = log.scrollHeight;
  }
}