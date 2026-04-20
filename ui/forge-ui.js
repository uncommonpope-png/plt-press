/**
 * /ui/forge-ui.js - Crafting interface
 */
export class ForgeUI {
  init(container) {
    const div = document.createElement('div');
    div.id = 'forge-ui';
    div.className = 'hidden';
    div.innerHTML = `<h3>⚒️ Forge</h3><div id="recipe-list"></div>`;
    container.appendChild(div);
  }
  show() { document.getElementById('forge-ui').classList.remove('hidden'); }
  hide() { document.getElementById('forge-ui').classList.add('hidden'); }
  updateRecipes(recipes) {
    document.getElementById('recipe-list').innerHTML = recipes.map(r => 
      `<div class="recipe" data-id="${r.id}">${r.name}</div>`
    ).join('');
  }
}