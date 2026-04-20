/**
 * SOULVERSE ENGINE — input.js
 * Unified keyboard, mouse, touch input.
 * All systems read from this — never add event listeners elsewhere.
 */

export class InputSystem {
  constructor() {
    this.keys    = {};
    this.mouse   = { x: 0, y: 0, buttons: [false, false, false], worldX: 0, worldZ: 0 };
    this.touch   = { active: false, x: 0, y: 0, joyX: 0, joyY: 0 };
    this._longPressTimer = null;
    this.onLongPress = null; // callback(x,y)

    window.addEventListener('keydown', e => { this.keys[e.code] = true;  this._onKeyDown(e); });
    window.addEventListener('keyup',   e => { this.keys[e.code] = false; });
    window.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
    window.addEventListener('mousedown', e => { this.mouse.buttons[e.button] = true; });
    window.addEventListener('mouseup',   e => { this.mouse.buttons[e.button] = false; });
    window.addEventListener('touchstart', e => this._onTouchStart(e), { passive: false });
    window.addEventListener('touchmove',  e => this._onTouchMove(e),  { passive: false });
    window.addEventListener('touchend',   e => this._onTouchEnd(e));
  }

  isDown(code) { return !!this.keys[code]; }

  _onKeyDown(e) {
    if (e.code === 'Escape') window.closeAllPanels?.();
    if (e.code === 'KeyB')   window.openPanel?.('build-panel');
    if (e.code === 'KeyQ')   window.toggleActionWheel?.();
    if (e.code === 'KeyP')   window.triggerProphecy?.();
  }

  _onTouchStart(e) {
    const t = e.touches[0];
    this.touch.active = true;
    this.touch.x = t.clientX; this.touch.y = t.clientY;
    this._longPressTimer = setTimeout(() => {
      if (this.onLongPress) this.onLongPress(t.clientX, t.clientY);
    }, 500);
  }
  _onTouchMove(e) {
    const t = e.touches[0];
    this.touch.x = t.clientX; this.touch.y = t.clientY;
    clearTimeout(this._longPressTimer);
  }
  _onTouchEnd() {
    this.touch.active = false;
    clearTimeout(this._longPressTimer);
  }

  update() {} // no-op; event-driven
}
