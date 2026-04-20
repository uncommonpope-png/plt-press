/**
 * SOULVERSE — world.js
 * Master world controller. Owns terrain, sky, water, weather, portals.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { Sky }   from 'https://unpkg.com/three@0.128.0/examples/jsm/objects/Sky.js';
import { Water } from 'https://unpkg.com/three@0.128.0/examples/jsm/objects/Water.js';

export const BIOMES = [
  { id: 'forge_lands',      name: 'Forge Lands',      color: 0xff6622, fogColor: 0x1a0800, level: [1,10]  },
  { id: 'code_canyon',      name: 'Code Canyon',      color: 0x44aaff, fogColor: 0x000a1a, level: [5,15]  },
  { id: 'memory_forest',    name: 'Memory Forest',    color: 0x44dd88, fogColor: 0x001a08, level: [8,20]  },
  { id: 'crimson_desert',   name: 'Crimson Desert',   color: 0xdd4444, fogColor: 0x1a0000, level: [12,25] },
  { id: 'digital_wasteland',name: 'Digital Wasteland',color: 0xaaaaaa, fogColor: 0x0a0a0a, level: [18,30] },
  { id: 'soul_sanctum',     name: 'Soul Sanctum',     color: 0xaa44ff, fogColor: 0x08001a, level: [25,40] },
];

export class WorldSystem {
  constructor(scene, assets) {
    this.scene  = scene;
    this.assets = assets;
    this.loopT  = 0;
    this._sky = null;
    this._skyU = null;
    this._water = null;
    this._sun = null;
    this._buildTerrain();
    this._buildSky();
    this._buildWater();
  }

  /** Height function — canonical terrain formula */
  static getHeight(x, z) {
    let h = 0;
    h += Math.sin(x * 0.07) * Math.cos(z * 0.07) * 2.0;
    h += Math.sin(x * 0.20) * 0.8;
    h += Math.cos(z * 0.20) * 0.8;
    h += Math.sin(x * 0.50 + z * 0.30) * 0.5;
    return Math.max(0.2, h + 3.0);
  }

  _buildTerrain() {
    const geo = new THREE.PlaneGeometry(160, 160, 80, 80);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position.array;
    for (let i = 0; i < pos.length / 3; i++)
      pos[i * 3 + 1] = WorldSystem.getHeight(pos[i * 3], pos[i * 3 + 2]);
    geo.computeVertexNormals();

    const tex = this.assets?.texture('https://threejs.org/examples/textures/terrain/grasslight-big.jpg', 8);
    this.terrain = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8, metalness: 0.05 }));
    this.terrain.castShadow = this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  _buildSky() {
    try {
      this._sky = new Sky(); this._sky.scale.setScalar(500);
      this.scene.add(this._sky);
      this._skyU = this._sky.material.uniforms;
      this._skyU['turbidity'].value = 10;
      this._skyU['rayleigh'].value  = 2;
      this._skyU['mieCoefficient'].value   = 0.005;
      this._skyU['mieDirectionalG'].value  = 0.8;
    } catch(e) {}
  }

  _buildWater() {
    try {
      const tex = new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/waternormals.jpg',
        t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
      );
      this._water = new Water(new THREE.PlaneGeometry(200, 200), {
        textureWidth: 512, textureHeight: 512,
        waterNormals: tex, sunColor: 0xffffff,
        waterColor: 0x3399ff, reflectivity: 0.3, side: THREE.DoubleSide
      });
      this._water.rotation.x = -Math.PI / 2;
      this._water.position.y = -0.5;
      this.scene.add(this._water);
    } catch(e) {}
  }

  update(dt) {
    this.loopT += dt;
    if (this._skyU) {
      const el = 0.2 + Math.sin(this.loopT * 0.02) * 0.12;
      const sp = new THREE.Vector3(Math.cos(0.3) * Math.cos(el), Math.sin(el), Math.sin(0.3) * Math.cos(el));
      this._skyU['sunPosition'].value = sp;
      if (this._sun) this._sun.position.copy(sp.clone().multiplyScalar(60));
    }
    if (this._water) this._water.material.uniforms['time'].value += dt;
  }
}
