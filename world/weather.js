/**
 * SOULVERSE CANONICAL ENGINE
 * /world/weather.js
 * Manages dynamic weather: rain, fog, wind, storms — all affect PLT economy
 */

export class WeatherSystem {
  constructor(engine) {
    this.engine = engine;
    this.scene = engine.renderer.scene;

    this.state = {
      type: 'clear',      // clear | rain | storm | fog | wind | blizzard
      intensity: 0.0,     // 0.0 - 1.0
      wind: { x: 0, z: 0, speed: 0 },
      temperature: 20,    // celsius
      visibility: 1.0,    // 0.0 - 1.0
      time: 0,            // accumulated seconds
      nextChange: 60,     // seconds until weather shift
    };

    this.particles = [];
    this.lightingOverride = null;
    this._buildParticlePool();
  }

  _buildParticlePool() {
    // Reusable particle array — activated on rain/snow/storm
    this._particlePool = [];
    for (let i = 0; i < 2000; i++) {
      this._particlePool.push({
        active: false,
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 1,
      });
    }
  }

  _getParticle() {
    for (const p of this._particlePool) {
      if (!p.active) return p;
    }
    return null;
  }

  update(dt) {
    this.state.time += dt;

    // Scheduled weather shift
    if (this.state.time >= this.state.nextChange) {
      this._shiftWeather();
    }

    // Update wind
    this.state.wind.x += (Math.random() - 0.5) * 0.01 * dt;
    this.state.wind.z += (Math.random() - 0.5) * 0.01 * dt;
    this.state.wind.x = Math.max(-1, Math.min(1, this.state.wind.x));
    this.state.wind.z = Math.max(-1, Math.min(1, this.state.wind.z));
    this.state.wind.speed = Math.sqrt(this.state.wind.x ** 2 + this.state.wind.z ** 2);

    this._spawnParticles(dt);
    this._updateParticles(dt);
    this._applyPLTEffects(dt);
  }

  _shiftWeather() {
    const types = ['clear', 'clear', 'clear', 'rain', 'rain', 'fog', 'wind', 'storm'];
    this.state.type = types[Math.floor(Math.random() * types.length)];
    this.state.intensity = 0.2 + Math.random() * 0.8;
    this.state.time = 0;
    this.state.nextChange = 30 + Math.random() * 120;
    this.state.visibility = this.state.type === 'fog' ? 0.3 + Math.random() * 0.4 : 1.0;

    console.log(`[WeatherSystem] Weather shifted → ${this.state.type} (intensity: ${this.state.intensity.toFixed(2)})`);

    // Emit engine event
    if (this.engine.events) {
      this.engine.events.emit('weather:change', { ...this.state });
    }
  }

  _spawnParticles(dt) {
    if (this.state.type !== 'rain' && this.state.type !== 'storm') return;

    const spawnRate = this.state.intensity * 200 * dt;
    const count = Math.floor(spawnRate);

    for (let i = 0; i < count; i++) {
      const p = this._getParticle();
      if (!p) break;
      const cam = this.engine.camera;
      const cx = cam ? cam.position.x : 0;
      const cz = cam ? cam.position.z : 0;
      p.active = true;
      p.x = cx + (Math.random() - 0.5) * 80;
      p.y = 40 + Math.random() * 20;
      p.z = cz + (Math.random() - 0.5) * 80;
      p.vx = this.state.wind.x * 5;
      p.vy = -15 - Math.random() * 10;
      p.vz = this.state.wind.z * 5;
      p.life = 0;
      p.maxLife = 2.5 + Math.random();
    }
  }

  _updateParticles(dt) {
    for (const p of this._particlePool) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.life += dt;
      if (p.life >= p.maxLife || p.y < 0) {
        p.active = false;
      }
    }
  }

  _applyPLTEffects(dt) {
    if (!this.engine.economy) return;

    const eco = this.engine.economy;

    switch (this.state.type) {
      case 'storm':
        // Storms suppress profit, can destroy buildings
        eco.applyDelta({ profit: -0.02 * this.state.intensity * dt, love: -0.01 * dt, tax: 0 });
        break;
      case 'rain':
        // Rain boosts crops/love slightly
        eco.applyDelta({ profit: 0, love: 0.005 * dt, tax: 0 });
        break;
      case 'fog':
        // Fog reduces tax collection (hard to see / assess)
        eco.applyDelta({ profit: 0, love: 0, tax: -0.005 * dt });
        break;
      default:
        break;
    }
  }

  getWindVector() {
    return { ...this.state.wind };
  }

  getFogDensity() {
    if (this.state.type !== 'fog') return 0;
    return this.state.intensity * 0.05;
  }

  serialize() {
    return { ...this.state };
  }

  deserialize(data) {
    Object.assign(this.state, data);
  }
}
