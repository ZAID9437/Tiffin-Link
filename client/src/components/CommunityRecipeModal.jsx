import React, { useState } from 'react';
import {
  ChefHat,
  Award,
  Sparkles,
  CheckCircle2,
  X,
  BookOpen,
  Heart,
  TrendingUp,
  Coins
} from 'lucide-react';
import { submitCommunityRecipe } from '../services/advancedFeaturesApi';

export default function CommunityRecipeModal({ isOpen, onClose }) {
  const [recipeName, setRecipeName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [region, setRegion] = useState('Gujarati Kathiyawadi');
  const [secretIngredients, setSecretIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dietaryType, setDietaryType] = useState('veg');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await submitCommunityRecipe({
        recipeName,
        authorName,
        region,
        dietaryType,
        secretIngredients: secretIngredients.split(',').map(s => s.trim()).filter(Boolean),
        instructions
      });
      if (res && res.success) {
        setSubmitted(true);
      }
    } catch (e) {
      alert('Recipe submitted: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-onyx-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-bone-white dark:bg-[#18181B] rounded-2xl shadow-2xl border border-sand-neutral/80 dark:border-stone-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Editorial Artisanal Theme */}
        <div className="p-6 bg-surface-container dark:bg-stone-900 border-b border-sand-neutral/80 dark:border-stone-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-label-caps text-[11px] font-bold tracking-[0.25em] text-[#6B4B2B] dark:text-[#D4AF37] uppercase flex items-center gap-1.5">
                <ChefHat className="w-3.5 h-3.5" />
                CULINARY CREATOR VAULT
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-label-caps tracking-wider uppercase bg-sand-neutral/80 dark:bg-stone-800 text-onyx-black dark:text-stone-300 border border-sand-neutral">
                EARN ROYALTIES
              </span>
            </div>
            <h3 className="font-headline-md font-serif text-2xl sm:text-3xl text-onyx-black dark:text-bone-white font-normal leading-tight">
              Community Chef Spotlight
            </h3>
            <p className="font-body-md text-xs sm:text-sm text-secondary dark:text-stone-400">
              Share your family heirloom recipe &amp; earn royalty credits whenever partner kitchens cook it.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-sand-neutral/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-sand-neutral/80 dark:border-stone-700 flex items-center justify-center text-onyx-black dark:text-stone-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-stone-900 dark:text-stone-100">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base">Recipe Sent for Culinary Review!</h4>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Our chef curation panel will test <strong>{recipeName}</strong>. Once approved, local partner kitchens will feature it on their menu, and you&apos;ll earn <strong>5% royal credit</strong> on every single thali ordered!
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-surface-container-lowest dark:bg-[#1E1E22] border border-sand-neutral/80 dark:border-stone-800 flex items-center gap-3 shadow-2xs">
                <Coins className="w-5 h-5 text-[#6B4B2B] dark:text-[#D4AF37] shrink-0" />
                <div className="text-xs font-body-md">
                  <span className="font-bold text-onyx-black dark:text-stone-200">Earn ₹5 - ₹10 Per Tiffin:</span>{' '}
                  <span className="text-secondary dark:text-stone-400">
                    Over ₹45,000 paid out this month to grandmother &amp; home-chef contributors across Gujarat!
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Recipe / Dish Title
                  </label>
                  <input
                    type="text"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    placeholder="e.g. Baa&apos;s Methi Thepla"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Your Name / Pen Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Neha Ben"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Cuisine Regional Style
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Gujarati Kathiyawadi">Kathiyawadi / Saurashtra</option>
                    <option value="Surati Gujarati">Surati (Sweet & Savory)</option>
                    <option value="Rajasthani Marwari">Rajasthani Marwari</option>
                    <option value="Maharashtrian">Maharashtrian Desi</option>
                    <option value="North Indian Ghar Jaisa">North Indian Homestyle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={dietaryType}
                    onChange={(e) => setDietaryType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="veg">100% Pure Veg</option>
                    <option value="jain">Jain (No Onion/Garlic/Root Veg)</option>
                    <option value="swaminarayan">Swaminarayan Satvik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Secret Spices & Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={secretIngredients}
                  onChange={(e) => setSecretIngredients(e.target.value)}
                  placeholder="e.g. White sesame seeds, roasted cumin, desi cow ghee, rock salt"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                  Preparation Instructions / Secret Tips
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Describe how to slow-cook, tempering techniques, or dough-kneading secrets..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-lg bg-onyx-black hover:bg-[#6B4B2B] text-bone-white font-button-text font-medium text-xs tracking-[0.15em] uppercase transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'SUBMITTING RECIPE...' : 'SUBMIT RECIPE & REGISTER FOR ROYALTIES'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
