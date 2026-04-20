/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/animation-system.js
 * Handles entity animations, skeletal animation, sprite sheets
 */

export class AnimationSystem {
  constructor(engine) {
    this.engine = engine;
    this.animations = new Map();
    this.currentAnims = new Map();
  }

  register(name, config) {
    this.animations.set(name, {
      frames: config.frames || [],
      speed: config.speed || 1,
      loop: config.loop !== false,
      onComplete: config.onComplete || null
    });
  }

  play(entity, animName, forceRestart = false) {
    const anim = this.animations.get(animName);
    if (!anim) return;
    
    const current = this.currentAnims.get(entity.id);
    if (current && current.name === animName && !forceRestart) return;
    
    this.currentAnims.set(entity.id, {
      name: animName,
      frameIndex: 0,
      time: 0,
      playing: true
    });
  }

  stop(entity) {
    const current = this.currentAnims.get(entity.id);
    if (current) current.playing = false;
  }

  update(dt, entities) {
    for (const entity of entities) {
      const anim = this.currentAnims.get(entity.id);
      if (!anim || !anim.playing) continue;
      
      const def = this.animations.get(anim.name);
      if (!def) continue;
      
      anim.time += dt;
      const frameTime = 1 / def.speed;
      
      if (anim.time >= frameTime) {
        anim.time = 0;
        anim.frameIndex++;
        
        if (anim.frameIndex >= def.frames.length) {
          if (def.loop) {
            anim.frameIndex = 0;
          } else {
            anim.frameIndex = def.frames.length - 1;
            anim.playing = false;
            if (def.onComplete) def.onComplete(entity);
          }
        }
      }
      
      // Apply frame to entity
      entity.currentFrame = def.frames[anim.frameIndex];
    }
  }

  getFrame(entity) {
    return entity.currentFrame || null;
  }
}
