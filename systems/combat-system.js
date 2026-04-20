/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/combat-system.js
 * PLT-based combat: damage scales with Profit/Love/Tax advantage
 */

export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
    this.damageTypes = ['physical', 'magical', 'soul', 'tax'];
  }

  calculateDamage(attacker, defender, baseDamage = 10) {
    const pltDiff = {
      profit: (attacker.plt?.profit || 0) - (defender.plt?.profit || 0),
      love: (attacker.plt?.love || 0) - (defender.plt?.love || 0),
      tax: (attacker.plt?.tax || 0) - (defender.plt?.tax || 0)
    };
    
    let multiplier = 1.0;
    
    // PLT advantage bonuses
    if (pltDiff.profit > 50) multiplier += 0.25;
    if (pltDiff.love > 50) multiplier += 0.25; // More love = more charisma in battle
    if (pltDiff.tax > 50) multiplier += 0.25; // Tax advantage = tactical superiority
    
    // Disadvantage
    if (pltDiff.profit < -50) multiplier -= 0.25;
    
    return Math.max(1, Math.floor(baseDamage * multiplier));
  }

  attack(attacker, defender, type = 'physical') {
    const damage = this.calculateDamage(attacker, defender);
    defender.health = Math.max(0, defender.health - damage);
    
    // PLT transfer on kill
    if (defender.health <= 0) {
      this.processKill(attacker, defender);
    }
    
    return { damage, targetHealth: defender.health };
  }

  processKill(killer, victim) {
    if (!this.engine.economy) return;
    
    const loot = {
      profit: Math.floor((victim.plt?.profit || 0) * 0.5),
      love: Math.floor((victim.plt?.love || 0) * 0.5),
      tax: Math.floor((victim.plt?.tax || 0) * 0.5)
    };
    
    this.engine.economy.earn(loot);
    
    if (this.engine.events) {
      this.engine.events.emit('combat:kill', { killer, victim, loot });
    }
  }

  canDefend(defender, incomingDamage) {
    const defense = (defender.stats?.defense || 0) + (defender.plt?.tax || 0) * 0.1;
    return defense >= incomingDamage * 0.5;
  }
}
