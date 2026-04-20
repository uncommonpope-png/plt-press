/**
 * SOULVERSE ENGINE — renderer.js
 * Three.js scene, renderer, post-processing.
 * Quality levels: 0=Performance, 1=Balanced, 2=Beautiful
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { EffectComposer } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }     from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { AfterimagePass } from 'https://unpkg.com/three@0.128.0/examples/jsm/postprocessing/AfterimagePass.js';

export class Renderer {
  constructor() {
    this.quality = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 0 : 1;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x050b1a, 0.008);

    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 800);
    this.camera.position.set(0, 18, 30);

    this.webgl = new THREE.WebGLRenderer({ antialias: this.quality > 0, powerPreference: 'high-performance' });
    this.webgl.setSize(innerWidth, innerHeight);
    this.webgl.setPixelRatio(this._pixelRatio());
    this.webgl.shadowMap.enabled = true;
    this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;
    this.webgl.toneMapping = THREE.ACESFilmicToneMapping;
    this.webgl.toneMappingExposure = 1.4;
    document.body.insertBefore(this.webgl.domElement, document.body.firstChild);

    this._buildLights();
    this._buildComposer();

    window.addEventListener('resize', () => this._onResize());
  }

  _pixelRatio() {
    return this.quality === 0 ? 1 : this.quality === 1 ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2);
  }

  _buildLights() {
    const s = this.scene;
    s.add(new THREE.AmbientLight(0x304060, 0.5));
    s.add(new THREE.HemisphereLight(0x87ceeb, 0x4a6741, 0.7));
    const sun = new THREE.DirectionalLight(0xffdd99, 1.2);
    sun.position.set(30, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = sun.shadow.mapSize.height = this.quality === 2 ? 2048 : 1024;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -40;
    sun.shadow.camera.right = sun.shadow.camera.top = 40;
    s.add(sun);
    this.sun = sun;
    s.add(Object.assign(new THREE.PointLight(0xccaa88, 0.4), { position: new THREE.Vector3(-10, 5, -5) }));
    s.add(Object.assign(new THREE.PointLight(0xffaa66, 0.3), { position: new THREE.Vector3(8, 6, -12) }));
  }

  _buildComposer() {
    this.composer = new EffectComposer(this.webgl);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    if (this.quality >= 1) {
      this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.8, 0.3, 0.9));
    }
    if (this.quality >= 2) {
      const af = new AfterimagePass(0.93);
      af.renderToScreen = true;
      this.composer.addPass(af);
    }
  }

  setQuality(q) {
    this.quality = q;
    this.webgl.setPixelRatio(this._pixelRatio());
    this._buildComposer();
  }

  render() { this.composer.render(); }

  _onResize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.webgl.setSize(innerWidth, innerHeight);
    this.composer.setSize(innerWidth, innerHeight);
  }

  get domElement() { return this.webgl.domElement; }
}
