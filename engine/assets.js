/**
 * SOULVERSE ENGINE — assets.js
 * Centralized asset loader. GLTF, textures, audio.
 */

import * as THREE from 'https://unpkg.com/three@0.128.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  constructor() {
    this._textures = {};
    this._models   = {};
    this._textureLoader = new THREE.TextureLoader();
    this._gltfLoader    = new GLTFLoader();
  }

  texture(url, repeat = 1) {
    if (this._textures[url]) return this._textures[url];
    const t = this._textureLoader.load(url);
    if (repeat > 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
    this._textures[url] = t;
    return t;
  }

  model(url) {
    return new Promise((resolve, reject) => {
      if (this._models[url]) { resolve(this._models[url]); return; }
      this._gltfLoader.load(url, gltf => {
        this._models[url] = gltf;
        resolve(gltf);
      }, undefined, reject);
    });
  }

  // Preload a list of texture URLs
  preloadTextures(urls) {
    return Promise.all(urls.map(u => new Promise(r => this._textureLoader.load(u, r))));
  }
}
