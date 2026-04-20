/**
 * SOULVERSE CANONICAL ENGINE
 * /entities/soul.js
 * A Soul entity — Form, Function, Fate. Core of the Soulverse.
 */

export const SOUL_TYPES = ['Warrior', 'Sage', 'Merchant', 'Builder', 'Wanderer', 'Oracle', 'Trickster'];
export const SOUL_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];

export class Soul {
  constructor(config = {}) {
    this.id = config.id || `soul_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.type = 'soul';

    // Identity — Form
    this.name = config.name || _randomName();
    this.soulType = config.soulType || SOUL_TYPES[Math.floor(Math.random() * SOUL_TYPES.length)];
    this.rarity = config.rarity || _rollRarity();
    this.color = config.color || _rarityColor(this.rarity);

    // Position in world
    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };

    // Function — what the soul does
    this.function = config.function || 'idle'; // idle | work | wander | follow | fight | build

    // Fate — persistent story
    this.fate = config.fate || { prophecy: null, fulfilled: false, events: [] };

    // Soul stats
    this.stats = {
      strength: config.stats?.strength || 5 + Math.floor(Math.random() * 10),
      wisdom: config.stats?.wisdom || 5 + Math.floor(Math.random() * 10),
      agility: config.stats?.agility || 5 + Math.floor(Math.random() * 10),
      charisma: config.stats?.charisma || 5 + Math.floor(Math.random() * 10),
      spirit: config.stats?.spirit || 5 + Math.floor(Math.random() * 10),
    };

    // PLT contribution per tick
    this.pltOutput = config.pltOutput || _calcPLTOutput(this);

    // Level & XP
    this.level = config.level || 1;
    this.xp = 0;
    this.xpToNext = 100;

    // Needs
    this.needs = { rest: 100, food: 100, purpose: 100 };

    // Relationship to player (0-100)
    this.bond = config.bond || 0;

    // Current assignment
    this.assignedBuildingId = config.assignedBuildingId || null;

    // Alive
    this.isAlive = true;
    this.isCaptured = config.isCaptured || false;
  }

  update(dt) {
    if (!this.isAlive) return;

    // Decay needs
    this.needs.rest = Math.max(0, this.needs.rest - 0.1 * dt);
    this.needs.food = Math.max(0, this.needs.food - 0.08 * dt);
    this.needs.purpose = Math.max(0, this.needs.purpose - 0.05 * dt);

    // Passive wander
    if (this.function === 'wander' || this.function === 'idle') {
      this._wander(dt);
    }

    // Bond grows slightly when soul is purposeful and fed
    if (this.needs.purpose > 50 && this.needs.food > 50) {
      this.bond = Math.min(100, this.bond + 0.01 * dt);
    }
  }

  _wander(dt) {
    if (Math.random() < 0.01 * dt) {
      this.velocity.x = (Math.random() - 0.5) * 2;
      this.velocity.z = (Math.random() - 0.5) * 2;
    }
    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    // Dampen
    this.velocity.x *= 0.95;
    this.velocity.z *= 0.95;
  }

  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.xpToNext * 1.4);
      // Boost stats on level
      const stat = Object.keys(this.stats)[Math.floor(Math.random() * 5)];
      this.stats[stat] += 1;
      // Recalc PLT output
      this.pltOutput = _calcPLTOutput(this);
    }
  }

  getPLTTick(dt) {
    if (!this.isCaptured || !this.isAlive) return { profit: 0, love: 0, tax: 0 };
    const factor = (this.needs.purpose / 100) * (this.level / 10 + 0.9);
    return {
      profit: this.pltOutput.profit * factor * dt,
      love: this.pltOutput.love * factor * dt,
      tax: this.pltOutput.tax * factor * dt,
    };
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      soulType: this.soulType,
      rarity: this.rarity,
      color: this.color,
      position: this.position,
      function: this.function,
      fate: this.fate,
      stats: this.stats,
      pltOutput: this.pltOutput,
      level: this.level,
      xp: this.xp,
      xpToNext: this.xpToNext,
      needs: this.needs,
      bond: this.bond,
      assignedBuildingId: this.assignedBuildingId,
      isAlive: this.isAlive,
      isCaptured: this.isCaptured,
    };
  }

  static deserialize(data) {
    const soul = new Soul(data);
    Object.assign(soul, data);
    return soul;
  }
}

// --- Helpers ---

function _randomName() {
  const prefixes = ['Aer', 'Sol', 'Vex', 'Kir', 'Zan', 'Lum', 'Thar', 'Nyx', 'Eld', 'Vor'];
  const suffixes = ['us', 'an', 'iel', 'ox', 'ara', 'ion', 'eth', 'ax', 'un', 'or'];
  return prefixes[Math.floor(Math.random() * prefixes.length)] +
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

function _rollRarity() {
  const roll = Math.random();
  if (roll < 0.40) return 'Common';
  if (roll < 0.65) return 'Uncommon';
  if (roll < 0.82) return 'Rare';
  if (roll < 0.93) return 'Epic';
  if (roll < 0.99) return 'Legendary';
  return 'Mythic';
}

function _rarityColor(rarity) {
  const map = {
    Common: '#aaaaaa',
    Uncommon: '#44cc44',
    Rare: '#4488ff',
    Epic: '#aa44ff',
    Legendary: '#ffaa00',
    Mythic: '#ff2266',
  };
  return map[rarity] || '#ffffff';
}

function _calcPLTOutput(soul) {
  const s = soul.stats;
  return {
    profit: (s.strength + s.agility) * 0.05,
    love: (s.charisma + s.spirit) * 0.05,
    tax: s.wisdom * 0.02,
  };
}
