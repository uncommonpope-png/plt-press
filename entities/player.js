/**
 * SOULVERSE CANONICAL ENGINE
 * /entities/player.js
 * The player entity — Craig's avatar in the Soulverse
 */

export class Player {
  constructor(engine, config = {}) {
    this.engine = engine;
    this.id = 'player';
    this.type = 'player';

    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.rotation = config.rotation || { y: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };

    // Stats
    this.stats = {
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      level: config.level || 1,
      xp: 0,
      xpToNext: 100,
    };

    // PLT personal wallet
    this.plt = config.plt || { profit: 100, love: 100, tax: 0 };

    // Needs (Sims-style)
    this.needs = {
      hunger: 100,
      rest: 100,
      social: 100,
      purpose: 100,
    };

    // Inventory
    this.inventory = [];
    this.maxInventory = 20;

    // Equipped
    this.equipped = { weapon: null, armor: null, relic: null };

    // Soul bond — player's soul companion
    this.bondedSoulId = config.bondedSoulId || null;

    // Flags
    this.isGrounded = false;
    this.isAlive = true;
    this.isSprinting = false;
    this.isInteracting = false;

    this.speed = config.speed || 6;
    this.sprintMult = 1.8;
    this.jumpForce = 12;

    this._needsDecayRate = { hunger: 1, rest: 0.5, social: 0.3, purpose: 0.2 }; // per minute
  }

  update(dt) {
    if (!this.isAlive) return;

    // Decay needs
    const decayFactor = dt / 60;
    for (const [key, rate] of Object.entries(this._needsDecayRate)) {
      this.needs[key] = Math.max(0, this.needs[key] - rate * decayFactor);
    }

    // Health penalty from critical needs
    if (this.needs.hunger < 10) {
      this.stats.health -= 0.5 * dt;
    }

    // XP level-up
    while (this.stats.xp >= this.stats.xpToNext) {
      this._levelUp();
    }

    if (this.stats.health <= 0) {
      this._die();
    }
  }

  _levelUp() {
    this.stats.xp -= this.stats.xpToNext;
    this.stats.level++;
    this.stats.xpToNext = Math.floor(this.stats.xpToNext * 1.4);
    this.stats.maxHealth += 10;
    this.stats.health = this.stats.maxHealth;
    console.log(`[Player] Level up! Now level ${this.stats.level}`);
    if (this.engine.events) this.engine.events.emit('player:levelup', { level: this.stats.level });
  }

  _die() {
    this.isAlive = false;
    console.log('[Player] Player died');
    if (this.engine.events) this.engine.events.emit('player:death', { player: this });
  }

  gainXP(amount) {
    this.stats.xp += amount;
  }

  heal(amount) {
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
  }

  takeDamage(amount) {
    this.stats.health = Math.max(0, this.stats.health - amount);
    if (this.stats.health <= 0) this._die();
  }

  addToInventory(item) {
    if (this.inventory.length >= this.maxInventory) return false;
    this.inventory.push(item);
    return true;
  }

  removeFromInventory(itemId) {
    const idx = this.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return null;
    return this.inventory.splice(idx, 1)[0];
  }

  earnPLT(delta) {
    this.plt.profit = Math.max(0, this.plt.profit + (delta.profit || 0));
    this.plt.love = Math.max(0, this.plt.love + (delta.love || 0));
    this.plt.tax = Math.max(0, this.plt.tax + (delta.tax || 0));
  }

  serialize() {
    return {
      position: this.position,
      rotation: this.rotation,
      stats: this.stats,
      plt: this.plt,
      needs: this.needs,
      inventory: this.inventory,
      equipped: this.equipped,
      bondedSoulId: this.bondedSoulId,
    };
  }

  deserialize(data) {
    Object.assign(this.position, data.position);
    Object.assign(this.rotation, data.rotation);
    Object.assign(this.stats, data.stats);
    Object.assign(this.plt, data.plt);
    Object.assign(this.needs, data.needs);
    this.inventory = data.inventory || [];
    this.equipped = data.equipped || {};
    this.bondedSoulId = data.bondedSoulId;
  }
}
