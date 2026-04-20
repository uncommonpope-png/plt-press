/**
 * SOULVERSE ENGINE — physics.js
 * Lightweight terrain-aware physics. No rigid body lib — keeps bundle tiny.
 * Provides: gravity, terrain snap, collision radius checks.
 */

export class PhysicsSystem {
  constructor(getHeightFn) {
    this.getHeight = getHeightFn; // (x, z) => number
    this.gravity   = -18;
    this._bodies   = new Map(); // id => { mesh, vy, onGround }
  }

  register(id, mesh, options = {}) {
    this._bodies.set(id, { mesh, vy: 0, onGround: false, radius: options.radius ?? 0.5 });
  }

  unregister(id) { this._bodies.delete(id); }

  update(dt) {
    for (const [, b] of this._bodies) {
      const groundY = this.getHeight(b.mesh.position.x, b.mesh.position.z) + b.radius;
      b.vy += this.gravity * dt;
      b.mesh.position.y += b.vy * dt;
      if (b.mesh.position.y <= groundY) {
        b.mesh.position.y = groundY;
        b.vy = 0;
        b.onGround = true;
      } else {
        b.onGround = false;
      }
    }
  }

  isOnGround(id) { return this._bodies.get(id)?.onGround ?? true; }

  jump(id, force = 7) {
    const b = this._bodies.get(id);
    if (b && b.onGround) b.vy = force;
  }

  /** Circle-circle overlap for simple collision */
  static overlap(ax, az, ar, bx, bz, br) {
    return Math.hypot(ax - bx, az - bz) < (ar + br);
  }
}
