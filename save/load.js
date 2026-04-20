/**
 * /save/load.js - Load game state
 */
export class LoadSystem {
  constructor(engine) {
    this.engine = engine;
  }

  load(json) {
    try {
      const state = JSON.parse(json);
      
      if (state.world && this.engine.world) {
        this.engine.world.deserialize(state.world);
      }
      
      if (state.player && this.engine.player) {
        this.engine.player.deserialize(state.player);
      }
      
      if (state.entities) {
        this.engine.entityManager?.clear();
        for (const data of state.entities) {
          this.engine.entityManager?.spawn(data);
        }
      }
      
      if (state.economy && this.engine.economy) {
        Object.assign(this.engine.economy.globalPLT, state.economy);
      }
      
      console.log('[Load] Game loaded from', new Date(state.timestamp));
      return true;
    } catch (e) {
      console.error('[Load] Failed:', e);
      return false;
    }
  }

  loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(this.load(reader.result));
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  loadAutoSave() {
    const json = localStorage.getItem('soulverse_save');
    if (json) return this.load(json);
    return false;
  }
}