/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/habitat-system.js
 * Soul housing, needs, well-being
 */

export class HabitatSystem {
  constructor(engine) {
    this.engine = engine;
    this.needsDecay = { hunger: 1, rest: 0.5, social: 0.3, purpose: 0.2 };
  }

  update(dt, souls) {
    for (const soul of souls) {
      if (!soul.isCaptured) continue;
      
      // Decay needs
      if (soul.needs.hunger > 0) soul.needs.hunger -= this.needsDecay.hunger * dt;
      if (soul.needs.rest > 0) soul.needs.rest -= this.needsDecay.rest * dt;
      
      // Need fulfillment from habitat
      const habitat = this.getSoulHabitat(soul);
      if (habitat) {
        soul.needs.hunger = Math.min(100, soul.needs.hunger + habitat.foodRate * dt);
        soul.needs.rest = Math.min(100, soul.needs.rest + habitat.restRate * dt);
      }
      
      // Critical needs affect PLT output
      if (soul.needs.hunger < 20) {
        soul.happiness = (soul.happiness || 0) - 5 * dt;
      }
    }
  }

  getSoulHabitat(soul) {
    if (!soul.assignedBuildingId) return null;
    return this.engine.entityManager.getById(soul.assignedBuildingId);
  }

  getWellbeing(soul) {
    return (soul.needs.hunger + soul.needs.rest + soul.needs.social + soul.needs.purpose) / 4;
  }
}