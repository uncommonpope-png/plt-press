/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/ai-system.js
 * AI decision making for NPCs, entities, agents
 */

export class AISystem {
  constructor(engine) {
    this.engine = engine;
    this.behaviors = new Map();
    this.registerDefaultBehaviors();
  }

  registerDefaultBehaviors() {
    this.behaviors.set('idle', this.behaviorIdle);
    this.behaviors.set('wander', this.behaviorWander);
    this.behaviors.set('seek', this.behaviorSeek);
    this.behaviors.set('flee', this.behaviorFlee);
    this.behaviors.set('guard', this.behaviorGuard);
    this.behaviors.set('work', this.behaviorWork);
  }

  update(entity, dt) {
    const behavior = entity.aiBehavior || 'idle';
    const fn = this.behaviors.get(behavior);
    if (fn) fn.call(this, entity, dt, this.engine);
  }

  setBehavior(entity, behavior) {
    entity.aiBehavior = behavior;
    entity.aiTimer = 0;
  }

  behaviorIdle(entity, dt, engine) {
    // Do nothing, just exist
  }

  behaviorWander(entity, dt, engine) {
    entity.aiTimer = (entity.aiTimer || 0) + dt;
    if (entity.aiTimer > 2 + Math.random() * 3) {
      entity.aiTimer = 0;
      const angle = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 5;
      entity.targetPosition = {
        x: entity.position.x + Math.cos(angle) * dist,
        y: entity.position.y,
        z: entity.position.z + Math.sin(angle) * dist
      };
    }
  }

  behaviorSeek(entity, dt, engine) {
    const target = entity.aiTarget;
    if (!target) {
      this.setBehavior(entity, 'idle');
      return;
    }
    const dx = target.position.x - entity.position.x;
    const dz = target.position.z - entity.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 1) {
      const speed = entity.speed || 3;
      entity.velocity.x = (dx / dist) * speed;
      entity.velocity.z = (dz / dist) * speed;
    } else {
      entity.aiOnArrive?.(entity, target);
    }
  }

  behaviorFlee(entity, dt, engine) {
    const threat = entity.aiTarget;
    if (!threat) {
      this.setBehavior(entity, 'idle');
      return;
    }
    const dx = entity.position.x - threat.position.x;
    const dz = entity.position.z - threat.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    const speed = entity.speed || 5;
    entity.velocity.x = (dx / dist) * speed;
    entity.velocity.z = (dz / dist) * speed;
  }

  behaviorGuard(entity, dt, engine) {
    // Guard a position, attack enemies that come close
    const guardPos = entity.guardPosition || entity.position;
    const dx = entity.position.x - guardPos.x;
    const dz = entity.position.z - guardPos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    // Return to guard position if too far
    if (dist > 5) {
      const speed = entity.speed || 2;
      entity.velocity.x = (-dx / dist) * speed;
      entity.velocity.z = (-dz / dist) * speed;
    }
  }

  behaviorWork(entity, dt, engine) {
    // Assigned building produces PLT
    if (entity.assignedBuildingId) {
      entity.workTimer = (entity.workTimer || 0) + dt;
      if (entity.workTimer >= 10) {
        entity.workTimer = 0;
        // Trigger production
        if (engine.events) {
          engine.events.emit('work:produce', { 
            entity, 
            buildingId: entity.assignedBuildingId 
          });
        }
      }
    }
  }
}
