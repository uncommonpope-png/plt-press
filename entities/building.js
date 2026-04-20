/**
 * SOULVERSE CANONICAL ENGINE
 * /entities/building.js
 * Structures that produce PLT, house souls, and define the world economy
 */

export const BUILDING_TYPES = {
  SOUL_FORGE:    { label: 'Soul Forge',    cost: { profit: 200, love: 50 },  pltRate: { profit: 5, love: 1, tax: 0.5 }, capacity: 3 },
  MARKET:        { label: 'Market',        cost: { profit: 150, love: 20 },  pltRate: { profit: 8, love: 0, tax: 1 },   capacity: 5 },
  TEMPLE:        { label: 'Temple',        cost: { profit: 100, love: 100 }, pltRate: { profit: 0, love: 8, tax: 0 },   capacity: 4 },
  BARRACKS:      { label: 'Barracks',      cost: { profit: 180, love: 10 },  pltRate: { profit: 2, love: 0, tax: 2 },   capacity: 6 },
  HABITAT:       { label: 'Habitat',       cost: { profit: 80,  love: 30 },  pltRate: { profit: 1, love: 3, tax: 0 },   capacity: 8 },
  TAX_OFFICE:    { label: 'Tax Office',    cost: { profit: 120, love: 0 },   pltRate: { profit: 0, love: 0, tax: 5 },   capacity: 2 },
  ACADEMY:       { label: 'Academy',       cost: { profit: 200, love: 60 },  pltRate: { profit: 2, love: 4, tax: 1 },   capacity: 4 },
  GRAND_TOWER:   { label: 'Grand Tower',   cost: { profit: 500, love: 200 }, pltRate: { profit: 15, love: 10, tax: 5 }, capacity: 12 },
};

export class Building {
  constructor(config = {}) {
    this.id = config.id || `building_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.type = 'building';
    this.buildingType = config.buildingType || 'HABITAT';

    const def = BUILDING_TYPES[this.buildingType] || BUILDING_TYPES.HABITAT;
    this.label = def.label;
    this.pltRate = { ...def.pltRate };
    this.capacity = def.capacity;

    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.rotation = config.rotation || { y: 0 };
    this.size = config.size || { w: 4, h: 4, d: 4 };

    // Occupants (soul IDs)
    this.occupants = config.occupants || [];

    // Health
    this.health = config.health || 100;
    this.maxHealth = 100;

    // Construction
    this.isBuilt = config.isBuilt !== undefined ? config.isBuilt : true;
    this.buildProgress = config.buildProgress || (this.isBuilt ? 1.0 : 0.0);
    this.buildTime = config.buildTime || 10; // seconds

    // Upgrades
    this.upgradeLevel = config.upgradeLevel || 1;
    this.maxUpgradeLevel = 5;

    // Active
    this.isActive = config.isActive !== undefined ? config.isActive : true;
  }

  update(dt) {
    // Construction
    if (!this.isBuilt) {
      this.buildProgress += dt / this.buildTime;
      if (this.buildProgress >= 1.0) {
        this.buildProgress = 1.0;
        this.isBuilt = true;
        console.log(`[Building] ${this.label} (${this.id}) construction complete`);
      }
      return;
    }
  }

  getPLTTick(dt) {
    if (!this.isBuilt || !this.isActive || this.health <= 0) return { profit: 0, love: 0, tax: 0 };

    // More occupants = more output (up to capacity)
    const occupancyFactor = this.occupants.length / Math.max(1, this.capacity);
    const upgradeFactor = 1 + (this.upgradeLevel - 1) * 0.25;

    return {
      profit: this.pltRate.profit * occupancyFactor * upgradeFactor * dt,
      love:   this.pltRate.love   * occupancyFactor * upgradeFactor * dt,
      tax:    this.pltRate.tax    * upgradeFactor * dt,
    };
  }

  addOccupant(soulId) {
    if (this.occupants.length >= this.capacity) return false;
    if (this.occupants.includes(soulId)) return false;
    this.occupants.push(soulId);
    return true;
  }

  removeOccupant(soulId) {
    const idx = this.occupants.indexOf(soulId);
    if (idx === -1) return false;
    this.occupants.splice(idx, 1);
    return true;
  }

  upgrade() {
    if (this.upgradeLevel >= this.maxUpgradeLevel) return false;
    this.upgradeLevel++;
    this.maxHealth += 20;
    this.health = this.maxHealth;
    console.log(`[Building] ${this.label} upgraded to level ${this.upgradeLevel}`);
    return true;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isActive = false;
      console.log(`[Building] ${this.label} (${this.id}) destroyed`);
    }
  }

  repair(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.health > 0) this.isActive = true;
  }

  serialize() {
    return {
      id: this.id,
      buildingType: this.buildingType,
      position: this.position,
      rotation: this.rotation,
      occupants: this.occupants,
      health: this.health,
      maxHealth: this.maxHealth,
      isBuilt: this.isBuilt,
      buildProgress: this.buildProgress,
      upgradeLevel: this.upgradeLevel,
      isActive: this.isActive,
    };
  }

  static deserialize(data) {
    return new Building(data);
  }
}
