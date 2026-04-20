/**
 * SOULVERSE CANONICAL ENGINE
 * /world/portals.js
 * Inter-zone teleportation portals — link regions, cost PLT to activate/traverse
 */

export class PortalSystem {
  constructor(engine) {
    this.engine = engine;
    this.portals = new Map(); // id → Portal
    this._nextId = 1;
  }

  /**
   * Create a portal pair (entry + exit)
   * @param {Object} entryPos  {x, y, z}
   * @param {Object} exitPos   {x, y, z}
   * @param {Object} opts      { label, cost, zone, color }
   */
  createPair(entryPos, exitPos, opts = {}) {
    const id = this._nextId++;
    const entry = {
      id: `portal_${id}_a`,
      pairId: `portal_${id}_b`,
      position: { ...entryPos },
      label: opts.label || `Portal ${id}`,
      color: opts.color || '#00ffff',
      cost: opts.cost || { profit: 0, love: 5, tax: 1 },
      zone: opts.zone || 'world',
      active: true,
      radius: opts.radius || 2.5,
      cooldown: 0,
    };
    const exit = {
      id: `portal_${id}_b`,
      pairId: `portal_${id}_a`,
      position: { ...exitPos },
      label: opts.label ? `${opts.label} (Return)` : `Portal ${id} Return`,
      color: opts.color || '#00ffff',
      cost: opts.cost || { profit: 0, love: 5, tax: 1 },
      zone: opts.zone || 'world',
      active: true,
      radius: opts.radius || 2.5,
      cooldown: 0,
    };
    this.portals.set(entry.id, entry);
    this.portals.set(exit.id, exit);

    console.log(`[PortalSystem] Created portal pair: ${entry.id} ↔ ${exit.id}`);
    return { entry, exit };
  }

  update(dt) {
    for (const portal of this.portals.values()) {
      if (portal.cooldown > 0) {
        portal.cooldown = Math.max(0, portal.cooldown - dt);
      }
    }

    // Check entity collisions with portals
    if (this.engine.entityManager) {
      this._checkEntityCollisions();
    }
  }

  _checkEntityCollisions() {
    const entities = this.engine.entityManager.getAll();
    for (const portal of this.portals.values()) {
      if (!portal.active || portal.cooldown > 0) continue;

      for (const entity of entities) {
        if (!entity.position) continue;
        const dx = entity.position.x - portal.position.x;
        const dz = entity.position.z - portal.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < portal.radius) {
          this._teleport(entity, portal);
        }
      }
    }
  }

  _teleport(entity, portal) {
    const dest = this.portals.get(portal.pairId);
    if (!dest) return;

    // PLT cost check
    if (this.engine.economy) {
      const cost = portal.cost;
      const canAfford = this.engine.economy.canAfford(cost);
      if (!canAfford) {
        console.log(`[PortalSystem] ${entity.id} cannot afford portal cost`);
        if (this.engine.events) this.engine.events.emit('portal:blocked', { entity, portal, reason: 'insufficient_plt' });
        return;
      }
      this.engine.economy.spend(cost);
    }

    // Move entity to destination
    entity.position.x = dest.position.x;
    entity.position.y = dest.position.y;
    entity.position.z = dest.position.z;

    // Cool both ends to prevent infinite loop
    portal.cooldown = 3.0;
    dest.cooldown = 3.0;

    console.log(`[PortalSystem] Teleported ${entity.id} → ${dest.id}`);
    if (this.engine.events) {
      this.engine.events.emit('portal:teleport', { entity, from: portal, to: dest });
    }
  }

  activatePortal(id) {
    const p = this.portals.get(id);
    if (p) p.active = true;
  }

  deactivatePortal(id) {
    const p = this.portals.get(id);
    if (p) p.active = false;
  }

  getAll() {
    return Array.from(this.portals.values());
  }

  serialize() {
    return Array.from(this.portals.entries()).map(([k, v]) => ({ key: k, value: v }));
  }

  deserialize(data) {
    this.portals.clear();
    for (const { key, value } of data) {
      this.portals.set(key, value);
    }
  }
}
