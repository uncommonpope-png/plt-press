/**
 * SOULVERSE CANONICAL ENGINE
 * /systems/forge-system.js
 * Item crafting, soul merging, weapon forging
 */

export class ForgeSystem {
  constructor(engine) {
    this.engine = engine;
    this.recipes = new Map();
    this.registerDefaultRecipes();
  }

  registerDefaultRecipes() {
    this.register({
      id: 'soul_shard',
      inputs: { profit: 50 },
      outputs: { type: 'material', name: 'Soul Shard', value: 50 }
    });
    this.register({
      id: 'love_crystal',
      inputs: { love: 100 },
      outputs: { type: 'material', name: 'Love Crystal', value: 100 }
    });
    this.register({
      id: 'tax_license',
      inputs: { profit: 200, tax: 50 },
      outputs: { type: 'license', name: 'Tax Collector Badge', value: 250 }
    });
  }

  register(recipe) {
    this.recipes.set(recipe.id, recipe);
  }

  canCraft(recipeId, entity) {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return false;
    
    for (const [plt, cost] of Object.entries(recipe.inputs)) {
      if ((entity.plt?.[plt] || 0) < cost) return false;
    }
    return true;
  }

  craft(recipeId, entity) {
    if (!this.canCraft(recipeId, entity)) return null;
    
    const recipe = this.recipes.get(recipeId);
    
    // Deduct inputs
    for (const [plt, cost] of Object.entries(recipe.inputs)) {
      entity.plt[plt] -= cost;
    }
    
    // Add outputs
    const outputs = Array.isArray(recipe.outputs) ? recipe.outputs : [recipe.outputs];
    
    if (this.engine.events) {
      this.engine.events.emit('forge:craft', { entity, recipe: recipeId, outputs });
    }
    
    return outputs;
  }
}