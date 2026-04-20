/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/movement-system.js
 * Handles entity movement, physics, collision, pathfinding
 */

export class MovementSystem {
  constructor(engine) {
    this.engine = engine;
    this.gravity = -20;
    this.groundLevel = 0;
  }

  update(dt, entities) {
    for (const entity of entities) {
      if (!entity.position || entity.isStatic) continue;
      
      // Apply gravity
      if (!entity.isGrounded) {
        entity.velocity.y += this.gravity * dt;
      }
      
      // Apply velocity
      entity.position.x += entity.velocity.x * dt;
      entity.position.y += entity.velocity.y * dt;
      entity.position.z += entity.velocity.z * dt;
      
      // Ground collision
      if (entity.position.y <= this.groundLevel) {
        entity.position.y = this.groundLevel;
        entity.velocity.y = 0;
        entity.isGrounded = true;
      } else {
        entity.isGrounded = false;
      }
      
      // Apply friction
      const friction = entity.isGrounded ? 0.9 : 0.98;
      entity.velocity.x *= friction;
      entity.velocity.z *= friction;
    }
  }

  moveTo(entity, targetPos, speed) {
    const dx = targetPos.x - entity.position.x;
    const dz = targetPos.z - entity.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 0.5) {
      entity.velocity.x = 0;
      entity.velocity.z = 0;
      return true; // Arrived
    }
    
    const nx = dx / dist;
    const nz = dz / dist;
    entity.velocity.x = nx * speed;
    entity.velocity.z = nz * speed;
    return false;
  }

  jump(entity, force = 10) {
    if (entity.isGrounded) {
      entity.velocity.y = force;
      entity.isGrounded = false;
    }
  }

  stop(entity) {
    entity.velocity.x = 0;
    entity.velocity.y = 0;
    entity.velocity.z = 0;
  }
}
