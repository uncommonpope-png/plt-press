/**
 * SOULVERSE — minimap.js
 * Canvas-based minimap with fog-of-war, soul blips, building markers.
 */

export class MinimapSystem {
  constructor(canvasId = 'minimap-canvas', worldSize = 160) {
    this.canvas = document.getElementById(canvasId);
    this.ctx    = this.canvas?.getContext('2d');
    this.size   = this.canvas?.width ?? 130;
    this.worldSize = worldSize;
    this.scale  = this.size / worldSize;
    // Fog of war grid 40x40
    this.fogGrid = new Uint8Array(40 * 40).fill(0);
    this.fogCellSize = worldSize / 40;
  }

  revealAt(wx, wz, radius = 3) {
    const cx = Math.floor((wx + this.worldSize / 2) / this.fogCellSize);
    const cz = Math.floor((wz + this.worldSize / 2) / this.fogCellSize);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const nx = cx + dx, nz = cz + dz;
        if (nx >= 0 && nx < 40 && nz >= 0 && nz < 40)
          this.fogGrid[nz * 40 + nx] = 1;
      }
    }
  }

  draw(playerX, playerZ, souls = [], buildings = []) {
    if (!this.ctx) return;
    const c = this.ctx, s = this.size, hw = this.worldSize / 2;

    c.clearRect(0, 0, s, s);
    c.fillStyle = '#0a1020';
    c.beginPath(); c.arc(s/2, s/2, s/2, 0, Math.PI*2); c.fill();

    // Fog overlay cells
    for (let z = 0; z < 40; z++) {
      for (let x = 0; x < 40; x++) {
        if (!this.fogGrid[z * 40 + x]) {
          c.fillStyle = 'rgba(0,0,0,0.7)';
          const px = x * this.fogCellSize * this.scale;
          const pz = z * this.fogCellSize * this.scale;
          c.fillRect(px, pz, this.fogCellSize * this.scale + 1, this.fogCellSize * this.scale + 1);
        }
      }
    }

    // Buildings
    buildings.forEach(b => {
      c.fillStyle = '#ffaa00';
      const bx = (b.x + hw) * this.scale, bz = (b.z + hw) * this.scale;
      c.fillRect(bx - 3, bz - 3, 6, 6);
    });

    // Souls
    const soulColors = { profit: '#ffaa44', love: '#ff88aa', tax: '#88aaff' };
    souls.forEach(s => {
      c.fillStyle = soulColors[s.type] || '#ffffff';
      c.beginPath(); c.arc((s.x + hw) * this.scale, (s.z + hw) * this.scale, 2, 0, Math.PI*2); c.fill();
    });

    // Player
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc((playerX + hw) * this.scale, (playerZ + hw) * this.scale, 4, 0, Math.PI*2); c.fill();

    // Circle clip
    c.globalCompositeOperation = 'destination-in';
    c.beginPath(); c.arc(s/2, s/2, s/2, 0, Math.PI*2); c.fill();
    c.globalCompositeOperation = 'source-over';
  }

  update(dt, engine) {
    const cam = engine?.renderer?.camera;
    if (!cam) return;
    this.revealAt(cam.position.x, cam.position.z, 3);
    const souls = (window.SOUL_MESHES || []).map(sm => ({ type: sm.userData.type, x: sm.position.x, z: sm.position.z }));
    this.draw(cam.position.x, cam.position.z, souls, window.BUILDINGS || []);
  }
}
