/**
 * /save/save.js - Save game state
 */
export class SaveSystem {
  constructor(engine) {
    this.engine = engine;
  }

  save(filename = 'soulverse_save.json') {
    const state = {
      timestamp: Date.now(),
      version: '1.0',
      world: this.engine.world?.serialize(),
      player: this.engine.player?.serialize(),
      entities: (this.engine.entityManager?.getAll() || []).map(e => e.serialize()),
      economy: this.engine.economy?.getPLT(),
      quests: Array.from(this.engine.questSystem?.activeQuests.entries() || [])
    };
    
    const json = JSON.stringify(state, null, 2);
    localStorage.setItem('soulverse_save', json);
    
    // Also trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    return true;
  }

  autoSave() {
    return this.save('soulverse_autosave.json');
  }
}