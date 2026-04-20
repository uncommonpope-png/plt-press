/**
 * SOULVERSE ENGINE — camera.js
 * Smooth follow, orbit, first-person modes.
 * Camera collision stub for future expansion.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.128.0/examples/jsm/controls/OrbitControls.js';

export const CAMERA_MODE = { ORBIT: 'orbit', FOLLOW: 'follow', FPS: 'fps' };

export class CameraSystem {
  constructor(camera, domElement) {
    this.camera = camera;
    this.mode = CAMERA_MODE.ORBIT;
    this.target = new THREE.Vector3();
    this.shakeIntensity = 0;
    this._shake = new THREE.Vector3();

    if (domElement) this._buildOrbit(domElement);
  }

  _buildOrbit(dom) {
    this.orbit = new OrbitControls(this.camera, dom);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = Math.PI / 2.1;
    this.orbit.target.copy(this.target);
  }

  /** Call once renderer.domElement is available */
  attachDom(dom) { this._buildOrbit(dom); }

  shake(intensity = 0.3, duration = 0.3) {
    this.shakeIntensity = intensity;
    setTimeout(() => { this.shakeIntensity = 0; }, duration * 1000);
  }

  update(dt, engine) {
    if (this.orbit) {
      this.orbit.target.lerp(this.target, 0.08);
      this.orbit.update();
    }
    if (this.shakeIntensity > 0) {
      this._shake.set(
        (Math.random() - 0.5) * this.shakeIntensity,
        (Math.random() - 0.5) * this.shakeIntensity,
        0
      );
      this.camera.position.add(this._shake);
    }
  }

  setTarget(x, y, z) { this.target.set(x, y, z); }
}
