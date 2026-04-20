/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/fx-system.js
 * Visual effects: particles, trails, damage numbers, weather
 */

export class FXSystem {
  constructor(engine) {
    this.engine = engine;
    this.particles = [];
    this.damageNumbers = [];
    this.trails = [];
  }

  spawnParticle(config) {
    this.particles.push({
      x: config.x || 0,
      y: config.y || 0,
      z: config.z || 0,
      vx: config.vx || 0,
      vy: config.vy || 0,
      vz: config.vz || 0,
      life: config.life || 1,
      maxLife: config.life || 1,
      color: config.color || '#ff77aa',
      size: config.size || 5,
      type: config.type || 'dust'
    });
  }

  spawnDamageNumber(target, damage, type = 'physical') {
    this.damageNumbers.push({
      x: target.position.x,
      y: target.position.y + 2,
      z: target.position.z,
      value: damage,
      life: 1.5,
      type
    });
  }

  spawnTrail(entity, color = '#ff77aa') {
    this.trails.push({
      entityId: entity.id,
      positions: [{ ...entity.position }],
      maxLength: 20,
      color,
      life: 2
    });
  }

  update(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life -= dt;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    
    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.y += 2 * dt;
      d.life -= dt;
      
      if (d.life <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
    
    // Update trails
    for (const t of this.trails) {
      const entity = this.engine.entityManager.getById(t.entityId);
      if (entity) {
        t.positions.unshift({ ...entity.position });
        if (t.positions.length > t.maxLength) {
          t.positions.pop();
        }
      }
      t.life -= dt;
    }
    this.trails = this.trails.filter(t => t.life > 0);
  }

  getParticles() { return this.particles; }
  getDamageNumbers() { return this.damageNumbers; }
  getTrails() { return this.trails; }
}