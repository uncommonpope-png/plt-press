/**
 * SOULVERSE ENGINE — engine.js
 * Core game loop. Coordinates all systems each frame.
 * Doctrine: Do not block rendering. Do not hard-code logic here.
 */

import { Renderer } from './renderer.js';
import { CameraSystem } from './camera.js';
import { InputSystem } from './input.js';
import { AssetLoader } from './assets.js';

export class Engine {
  constructor() {
    this.systems = [];
    this.running = false;
    this.lastTime = 0;
    this.loopTime = 0;
    this.renderer = new Renderer();
    this.camera   = new CameraSystem(this.renderer.camera);
    this.input    = new InputSystem();
    this.assets   = new AssetLoader();
    this._frameCallbacks = [];
  }

  /** Register a system to receive update(dt, engine) each frame */
  register(system) {
    this.systems.push(system);
    return this;
  }

  /** Add a one-off per-frame callback (lightweight hooks) */
  onFrame(fn) { this._frameCallbacks.push(fn); }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this._loop();
  }

  stop() { this.running = false; }

  _loop() {
    if (!this.running) return;
    requestAnimationFrame(() => this._loop());
    const now = performance.now();
    const dt  = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime  = now;
    this.loopTime += dt;

    // Update all registered systems
    for (const sys of this.systems) {
      if (sys.update) sys.update(dt, this);
    }

    // One-off frame callbacks
    for (const fn of this._frameCallbacks) fn(dt, this);

    this.renderer.render();
  }
}

// Singleton export
export const engine = new Engine();
