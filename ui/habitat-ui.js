/**
 * /ui/habitat-ui.js - Soul housing
 */
export class HabitatUI {
  init(container) {
    const div = document.createElement('div');
    div.id = 'habitat-ui';
    div.className = 'hidden';
    div.innerHTML = `<h3>🏠 Habitat</h3><div id="building-list"></div>`;
    container.appendChild(div);
  }
  show() { document.getElementById('habitat-ui').classList.remove('hidden'); }
  hide() { document.getElementById('habitat-ui').classList.add('hidden'); }
  updateBuildings(buildings) {
    document.getElementById('building-list').innerHTML = buildings.map(b => 
      `<div class="building"><b>${b.label}</b> (L${b.upgradeLevel}) Occupants: ${b.occupants.length}/${b.capacity}</div>`
    ).join('');
  }
}