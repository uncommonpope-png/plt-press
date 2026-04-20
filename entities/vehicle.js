/**
 * SOULVERSE CANONICAL ENGINE
 * /entities/vehicle.js
 * Vehicles — mounts, ships, chariots — for traversal and combat
 */

export const VEHICLE_TYPES = {
  MOUNT:   { label: 'Mount',   speed: 14, capacity: 1, cost: { profit: 50, love: 20 } },
  CHARIOT: { label: 'Chariot', speed: 10, capacity: 4, cost: { profit: 120, love: 10 } },
  SHIP:    { label: 'Ship',    speed: 8,  capacity: 20, cost: { profit: 300, love: 50 } },
  SPEEDER: { label: 'Speeder', speed: 20, capacity: 2, cost: { profit: 200, love: 5 } },
};

export class Vehicle {
  constructor(config = {}) {
    this.id = config.id || `vehicle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.type = 'vehicle';
    this.vehicleType = config.vehicleType || 'MOUNT';

    const def = VEHICLE_TYPES[this.vehicleType] || VEHICLE_TYPES.MOUNT;
    this.label = def.label;
    this.baseSpeed = def.speed;
    this.capacity = def.capacity;

    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.rotation = config.rotation || { y: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };

    this.passengers = []; // entity IDs
    this.driverId = null;

    this.health = 100;
    this.maxHealth = 100;

    this.fuel = config.fuel !== undefined ? config.fuel : 100; // love-based fuel
    this.maxFuel = 100;
    this.fuelConsumption = config.fuelConsumption || 0.5; // per second of movement

    this.isMoving = false;
    this.isDestroyed = false;
  }

  update(dt) {
    if (this.isDestroyed) return;

    if (this.isMoving && this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - this.fuelConsumption * dt);
      if (this.fuel <= 0) {
        this.isMoving = false;
        console.log(`[Vehicle] ${this.id} out of fuel`);
      }
    }

    // Move
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // Dampen
    this.velocity.x *= 0.92;
    this.velocity.z *= 0.92;

    if (Math.abs(this.velocity.x) < 0.01 && Math.abs(this.velocity.z) < 0.01) {
      this.isMoving = false;
    }
  }

  mount(entityId) {
    if (this.driverId === null) {
      this.driverId = entityId;
      return true;
    }
    if (this.passengers.length < this.capacity - 1) {
      this.passengers.push(entityId);
      return true;
    }
    return false;
  }

  dismount(entityId) {
    if (this.driverId === entityId) {
      this.driverId = null;
      this.isMoving = false;
      return true;
    }
    const idx = this.passengers.indexOf(entityId);
    if (idx !== -1) { this.passengers.splice(idx, 1); return true; }
    return false;
  }

  accelerate(direction) {
    if (this.isDestroyed || this.fuel <= 0 || !this.driverId) return;
    const spd = this.baseSpeed;
    this.velocity.x += direction.x * spd * 0.3;
    this.velocity.z += direction.z * spd * 0.3;
    this.isMoving = true;
  }

  refuel(amount) {
    this.fuel = Math.min(this.maxFuel, this.fuel + amount);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.isDestroyed = true;
      console.log(`[Vehicle] ${this.id} destroyed`);
    }
  }

  serialize() {
    return {
      id: this.id,
      vehicleType: this.vehicleType,
      position: this.position,
      rotation: this.rotation,
      passengers: this.passengers,
      driverId: this.driverId,
      health: this.health,
      fuel: this.fuel,
      isDestroyed: this.isDestroyed,
    };
  }

  static deserialize(data) {
    return new Vehicle(data);
  }
}
