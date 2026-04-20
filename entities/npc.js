/**
 * SOULVERSE CANONICAL ENGINE
 * /entities/npc.js
 * Non-player characters — vendors, quest givers, citizens, guards
 */

export const NPC_ROLES = ['Vendor', 'QuestGiver', 'Citizen', 'Guard', 'Prophet', 'Banker', 'Smith'];

export class NPC {
  constructor(config = {}) {
    this.id = config.id || `npc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.type = 'npc';
    this.name = config.name || 'Unknown';
    this.role = config.role || NPC_ROLES[Math.floor(Math.random() * NPC_ROLES.length)];

    this.position = config.position || { x: 0, y: 0, z: 0 };
    this.homePosition = { ...this.position };
    this.velocity = { x: 0, y: 0, z: 0 };

    this.dialogues = config.dialogues || [];
    this.currentDialogue = 0;

    this.inventory = config.inventory || [];   // for vendors
    this.questIds = config.questIds || [];      // for quest givers

    this.isAlive = true;
    this.isInteractable = true;

    // PLT disposition
    this.plt = config.plt || { profit: 50, love: 50, tax: 0 };

    // AI state
    this.aiState = 'idle'; // idle | patrol | follow | flee | interact
    this.patrolPoints = config.patrolPoints || [];
    this._patrolIndex = 0;
    this._patrolTimer = 0;

    this.interactRadius = config.interactRadius || 3;
    this.speed = config.speed || 2.5;
  }

  update(dt) {
    if (!this.isAlive) return;

    switch (this.aiState) {
      case 'idle':
        this._patrolTimer += dt;
        if (this._patrolTimer > 5 && this.patrolPoints.length > 0) {
          this.aiState = 'patrol';
          this._patrolTimer = 0;
        }
        break;

      case 'patrol':
        this._doPatrol(dt);
        break;

      case 'flee':
        this._doFlee(dt);
        break;
    }
  }

  _doPatrol(dt) {
    if (this.patrolPoints.length === 0) { this.aiState = 'idle'; return; }

    const target = this.patrolPoints[this._patrolIndex];
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      this._patrolIndex = (this._patrolIndex + 1) % this.patrolPoints.length;
    } else {
      const nx = dx / dist;
      const nz = dz / dist;
      this.position.x += nx * this.speed * dt;
      this.position.z += nz * this.speed * dt;
    }
  }

  _doFlee(dt) {
    // Move away from home (panic direction)
    this.position.x += (Math.random() - 0.5) * this.speed * 2 * dt;
    this.position.z += (Math.random() - 0.5) * this.speed * 2 * dt;
  }

  speak(index) {
    return this.dialogues[index] || this.dialogues[this.dialogues.length - 1] || '...';
  }

  nextDialogue() {
    this.currentDialogue = Math.min(this.currentDialogue + 1, this.dialogues.length - 1);
    return this.speak(this.currentDialogue);
  }

  resetDialogue() {
    this.currentDialogue = 0;
  }

  startInteraction() {
    this.isInteractable = false;
    this.aiState = 'idle';
    return this.speak(this.currentDialogue);
  }

  endInteraction() {
    this.isInteractable = true;
    this.resetDialogue();
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      position: this.position,
      homePosition: this.homePosition,
      dialogues: this.dialogues,
      inventory: this.inventory,
      questIds: this.questIds,
      plt: this.plt,
      patrolPoints: this.patrolPoints,
    };
  }

  static deserialize(data) {
    return new NPC(data);
  }
}
