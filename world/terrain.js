/**
 * SOULVERSE — terrain.js
 * Terrain sculpting, height queries, vegetation spawner.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { WorldSystem } from './world.js';

export class TerrainSystem {
  constructor(scene, assets) {
    this.scene  = scene;
    this.assets = assets;
    this.mesh   = null;
    this._build();
    this._spawnVegetation();
    this._spawnGems();
    this.gemMeshes = this._gems;
  }

  /** Delegate to WorldSystem canonical formula */
  static getHeight(x, z) { return WorldSystem.getHeight(x, z); }

  _build() {
    const geo = new THREE.PlaneGeometry(160, 160, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++)
      pos[i * 3 + 1] = TerrainSystem.getHeight(pos[i * 3], pos[i * 3 + 2]);
    geo.computeVertexNormals();
    const tex = this.assets?.texture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg', 8);
    this.mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }));
    this.mesh.castShadow = this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);
  }

  _spawnVegetation() {
    const gMat = new THREE.MeshStandardMaterial({ color: 0x5a8a3c, roughness: 0.9 });
    const tMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.7 });
    const fMat = new THREE.MeshStandardMaterial({ color: 0x3a7a2c, roughness: 0.6 });
    const r = () => (Math.random() - 0.5) * 140;
    for (let i = 0; i < 500; i++) {
      const x = r(), z = r(), y = TerrainSystem.getHeight(x, z);
      if (y > 0.5 && y < 5 && Math.random() < 0.5) {
        const g = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 0.6, 3), gMat);
        g.position.set(x, y + 0.3, z); this.scene.add(g);
      }
    }
    for (let i = 0; i < 180; i++) {
      const x = r(), z = r(), y = TerrainSystem.getHeight(x, z);
      if (y > 0.8 && y < 4.5 && Math.random() < 0.4) {
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 2, 6), tMat);
        tr.position.set(x, y + 1, z); tr.castShadow = true; this.scene.add(tr);
        const fo = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2, 8), fMat);
        fo.position.set(x, y + 2.5, z); fo.castShadow = true; this.scene.add(fo);
      }
    }
  }

  _spawnGems() {
    const mats = {
      profit: new THREE.MeshStandardMaterial({ color: 0xffaa44, metalness: 0.9, emissive: 0x442200, emissiveIntensity: 0.4 }),
      love:   new THREE.MeshStandardMaterial({ color: 0xff88aa, emissive: 0x441122, emissiveIntensity: 0.4 }),
      tax:    new THREE.MeshStandardMaterial({ color: 0x88aaff, emissive: 0x224466, emissiveIntensity: 0.4 }),
    };
    this._gems = [];
    const types = ['profit', 'love', 'tax'];
    for (let i = 0; i < 90; i++) {
      const x = (Math.random() - 0.5) * 130, z = (Math.random() - 0.5) * 130;
      const y = TerrainSystem.getHeight(x, z) + 0.3;
      const t = types[i % 3];
      const geo = t === 'profit' ? new THREE.IcosahedronGeometry(0.3, 0)
                : t === 'love'   ? new THREE.DodecahedronGeometry(0.28)
                :                  new THREE.ConeGeometry(0.28, 0.5, 5);
      const m = new THREE.Mesh(geo, mats[t]);
      m.position.set(x, y, z);
      m.userData = { type: t, value: 8, collected: false };
      m.castShadow = true;
      this.scene.add(m);
      this._gems.push(m);
    }
  }

  update(dt, loopT) {
    for (let i = 0; i < this._gems.length; i++) {
      const g = this._gems[i];
      if (!g.userData.collected) {
        g.rotation.y += dt * 1.2;
        g.position.y = TerrainSystem.getHeight(g.position.x, g.position.z) + 0.3 + Math.sin(loopT * 2 + i) * 0.1;
      }
    }
  }

  /** Sculpt terrain at world point — costs PLT */
  sculpt(x, z, deltaY) {
    const pos = this.mesh.geometry.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++) {
      const dx = pos[i*3] - x, dz = pos[i*3+2] - z;
      const dist = Math.hypot(dx, dz);
      if (dist < 2.5) {
        const falloff = 1 - dist / 2.5;
        pos[i*3+1] = Math.max(0.2, Math.min(6, pos[i*3+1] + deltaY * falloff));
      }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }
}
