/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/quest-system.js
 * Quest missions, objectives, rewards (PLT-based)
 */

export class QuestSystem {
  constructor(engine) {
    this.engine = engine;
    this.quests = new Map();
    this.activeQuests = new Map();
  }

  register(quest) {
    this.quests.set(quest.id, quest);
  }

  accept(questId, entity) {
    const quest = this.quests.get(questId);
    if (!quest) return false;
    
    this.activeQuests.set(`${entity.id}_${questId}`, {
      quest,
      entityId: entity.id,
      progress: {},
      started: Date.now()
    });
    return true;
  }

  updateProgress(entityId, questId, objective, amount = 1) {
    const key = `${entityId}_${questId}`;
    const active = this.activeQuests.get(key);
    if (!active) return;
    
    const obj = active.quest.objectives.find(o => o.id === objective);
    if (obj) {
      active.progress[objective] = (active.progress[objective] || 0) + amount;
      this.checkCompletion(active);
    }
  }

  checkCompletion(active) {
    const completed = active.quest.objectives.every(o => {
      const prog = active.progress[o.id] || 0;
      return prog >= o.required;
    });
    
    if (completed && !active.completed) {
      active.completed = true;
      active.completedAt = Date.now();
      this.rewardPlayer(active);
    }
  }

  rewardPlayer(active) {
    const entity = this.engine.entityManager.getById(active.entityId);
    if (!entity) return;
    
    const reward = active.quest.reward;
    if (reward.plt) {
      this.engine.economy.earn(reward.plt, entity);
    }
    if (reward.xp) {
      entity.xp = (entity.xp || 0) + reward.xp;
    }
  }

  getActive(entityId) {
    return Array.from(this.activeQuests.values())
      .filter(q => q.entityId === entityId && !q.completed);
  }
}