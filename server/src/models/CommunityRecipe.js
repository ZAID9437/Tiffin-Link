const mongoose = require('mongoose');

const communityRecipeSchema = new mongoose.Schema({
  recipeName: { type: String, required: true },
  authorName: { type: String, required: true },
  region: { type: String, default: 'Gujarati Kathiyawadi' },
  dietaryType: { type: String, enum: ['veg', 'jain', 'swaminarayan'], default: 'veg' },
  secretIngredients: [{ type: String }],
  instructions: { type: String, required: true },
  status: { type: String, enum: ['pending_review', 'tested', 'featured', 'archived'], default: 'pending_review' },
  royaltiesEarned: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CommunityRecipe', communityRecipeSchema);
