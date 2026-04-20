/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/economy-system.js
 * PLT economy: Profit/Love/Tax production, consumption, trade
 */

export class EconomySystem {
  constructor(engine) {
    this.engine = engine;
    this.globalPLT = { profit: 1000, love: 1000, tax: 500 };
    this.rates = { taxRate: 0.1, tradeMarkup: 1.2 };
  }

  update(dt) {
    const entities = this.engine.entityManager?.getAll() || [];
    
    for (const entity of entities) {
      if (entity.buildingType && entity.isActive) {
        const prod = this.getBuildingProduction(entity);
        this.globalPLT.profit += prod.profit * dt;
        this.globalPLT.love += prod.love * dt;
        this.globalPLT.tax += prod.tax * dt;
      }
    }
    
    if (this.engine.events) {
      this.engine.events.emit('economy:tick', { plt: this.globalPLT });
    }
  }

  getBuildingProduction(building) {
    const def = building.pltRate || { profit: 1, love: 1, tax: 0 };
    const occupancy = building.occupants.length / building.capacity;
    const level = building.upgradeLevel || 1;
    return {
      profit: def.profit * occupancy * (1 + level * 0.25),
      love: def.love * occupancy * (1 + level * 0.25),
      tax: def.tax * (1 + level * 0.25)
    };
  }

  earnPLT(plt, entity) {
    entity.plt.profit += plt.profit || 0;
    entity.plt.love += plt.love || 0;
    entity.plt.tax += plt.tax || 0;
    this.globalPLT.profit += plt.profit || 0;
    this.globalPLT.love += plt.love || 0;
  }

  spendPLT(plt, entity) {
    const canAfford = entity.plt.profit >= (plt.profit || 0) &&
                     entity.plt.love >= (plt.love || 0) &&
                     entity.plt.tax >= (plt.tax || 0);
    if (!canAfford) return false;
    
    entity.plt.profit -= plt.profit || 0;
    entity.plt.love -= plt.love || 0;
    entity.plt.tax -= plt.tax || 0;
    return true;
  }

  tradeSeller(seller, item, price) {
    const tax = price * this.rates.taxRate;
    this.globalPLT.tax += tax;
    this.earnPLT({ profit: price - tax, love: 0 }, seller);
  }

  getPLT() { return { ...this.globalPLT }; }
}