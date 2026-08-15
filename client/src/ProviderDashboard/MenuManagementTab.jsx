import React, { useState } from 'react';
import { Plus, Edit3, Sparkles, AlertCircle, X } from 'lucide-react';

export default function MenuManagementTab() {
  const [filter, setFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [dishes, setDishes] = useState([
    {
      id: 'd1',
      title: 'Classic Veg Thali',
      price: 12.50,
      description: 'Paneer butter masala, dal tadka, rice, 3 rotis, and a sweet treat.',
      type: 'veg',
      tag: 'Live Now',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      available: 24,
      limit: 50,
      active: true,
      image: '/assets/provider_1.png'
    },
    {
      id: 'd2',
      title: 'Butter Chicken Combo',
      price: 15.00,
      description: 'Signature butter chicken with 2 garlic naans and basmati rice.',
      type: 'non-veg',
      tag: 'Inactive',
      tagColor: 'bg-gray-100 text-gray-600 border-gray-200',
      available: 0,
      limit: 30,
      active: false,
      image: '/assets/provider_2.png'
    },
    {
      id: 'd3',
      title: 'Special Veg Biryani',
      price: 10.00,
      description: 'Aromatic basmati rice cooked with mixed vegetables and authentic spices. Served with raita.',
      type: 'veg',
      tag: 'Selling Fast',
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
      available: 3,
      limit: 20,
      active: true,
      image: '/assets/provider_3.png'
    }
  ]);

  const [newDish, setNewDish] = useState({
    title: '',
    price: '',
    type: 'veg',
    description: '',
    limit: 30,
    image: '/assets/provider_4.png'
  });

  const toggleDishStatus = (id) => {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, active: !d.active, tag: !d.active ? 'Live Now' : 'Inactive' } : d));
  };

  const handleAddDishSubmit = (e) => {
    e.preventDefault();
    if (!newDish.title || !newDish.price) return;
    
    const created = {
      id: 'd_' + Date.now(),
      title: newDish.title,
      price: Number(newDish.price),
      description: newDish.description || 'Delicious freshly prepared homemade meal.',
      type: newDish.type,
      tag: 'Live Now',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      available: Number(newDish.limit),
      limit: Number(newDish.limit),
      active: true,
      image: newDish.image || '/assets/provider_4.png'
    };

    setDishes([created, ...dishes]);
    setIsAddModalOpen(false);
    setNewDish({ title: '', price: '', type: 'veg', description: '', limit: 30, image: '/assets/provider_4.png' });
  };

  const filteredDishes = dishes.filter(dish => {
    if (filter === 'veg') return dish.type === 'veg';
    if (filter === 'non-veg') return dish.type === 'non-veg';
    if (filter === 'specials') return dish.tag === 'Selling Fast';
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E5ECE8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E26] tracking-tight">Menu Management</h1>
          <p className="text-sm text-[#5B7067] mt-1">Manage your active dishes and daily availability.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 bg-[#0A8B5F] hover:bg-[#08734E] text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
            filter === 'all' ? 'bg-[#0A8B5F] text-white border-[#0A8B5F]' : 'bg-white text-[#5B7067] border-[#E5ECE8] hover:bg-gray-50'
          }`}
        >
          All Items
        </button>
        <button 
          onClick={() => setFilter('veg')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'veg' ? 'bg-[#0A8B5F] text-white border-[#0A8B5F]' : 'bg-white text-[#5B7067] border-[#E5ECE8] hover:bg-gray-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Veg</span>
        </button>
        <button 
          onClick={() => setFilter('non-veg')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'non-veg' ? 'bg-[#0A8B5F] text-white border-[#0A8B5F]' : 'bg-white text-[#5B7067] border-[#E5ECE8] hover:bg-gray-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span>Non-Veg</span>
        </button>
        <button 
          onClick={() => setFilter('specials')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
            filter === 'specials' ? 'bg-[#0A8B5F] text-white border-[#0A8B5F]' : 'bg-white text-[#5B7067] border-[#E5ECE8] hover:bg-gray-50'
          }`}
        >
          <span>⭐ Specials</span>
        </button>
      </div>

      {/* Dishes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDishes.map(dish => {
          const availPercent = Math.round((dish.available / dish.limit) * 100);
          return (
            <div key={dish.id} className="bg-white rounded-2xl border border-[#E5ECE8] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                {/* Image Container with Badges */}
                <div className="relative h-48 w-full bg-[#F4F8F6] overflow-hidden">
                  <img 
                    src={dish.image} 
                    alt={dish.title} 
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  {/* Veg / Non-Veg Icon Top Left */}
                  <div className="absolute top-3 left-3 bg-white p-1 rounded border border-[#E5ECE8] shadow-xs">
                    <div className={`w-3.5 h-3.5 border flex items-center justify-center p-0.5 ${dish.type === 'veg' ? 'border-emerald-600' : 'border-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${dish.type === 'veg' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    </div>
                  </div>
                  {/* Status Tag Top Right */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border shadow-xs ${dish.tagColor}`}>
                      ● {dish.tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-[#1A2E26]">{dish.title}</h3>
                    <span className="text-base font-extrabold text-[#0A8B5F]">${dish.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-[#5B7067] leading-relaxed line-clamp-2">{dish.description}</p>
                </div>
              </div>

              {/* Footer Progress & Toggle Controls */}
              <div className="p-5 pt-0 space-y-4">
                <div className="bg-[#F7FAF8] p-3 rounded-xl border border-[#E8F0EC] space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-[#1A2E26]">
                    <span>Daily Limit</span>
                    <span>{dish.available} / {dish.limit} available</span>
                  </div>
                  <div className="w-full bg-[#E8F0EC] h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${availPercent < 20 ? 'bg-amber-500' : 'bg-[#0A8B5F]'}`} 
                      style={{ width: `${availPercent}%` }} 
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleDishStatus(dish.id)}
                      className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none ${dish.active ? 'bg-[#0A8B5F]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${dish.active ? 'translate-x-5' : 'translate-x-0.5'} top-0.5 relative shadow-xs`} />
                    </button>
                    <span className="text-xs font-semibold text-[#1A2E26]">
                      {dish.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  <button className="p-2 text-[#5B7067] hover:text-[#0A8B5F] hover:bg-[#F4F8F6] rounded-lg transition-colors cursor-pointer border border-[#E5ECE8]">
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Dish Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[6000] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-[#E5ECE8] animate-fade-in space-y-5">
            <div className="flex justify-between items-center border-b border-[#E5ECE8] pb-4">
              <h2 className="text-lg font-bold text-[#1A2E26]">Add New Dish</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDishSubmit} className="space-y-4 text-xs font-semibold text-[#1A2E26]">
              <div>
                <label className="block mb-1 text-[#5B7067]">Dish Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Paneer Butter Masala Thali"
                  value={newDish.title}
                  onChange={e => setNewDish({ ...newDish, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F7FAF8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[#5B7067]">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={newDish.price}
                    onChange={e => setNewDish({ ...newDish, price: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F7FAF8]"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[#5B7067]">Dietary Type</label>
                  <select 
                    value={newDish.type}
                    onChange={e => setNewDish({ ...newDish, type: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F7FAF8]"
                  >
                    <option value="veg">🟢 Veg</option>
                    <option value="non-veg">🔴 Non-Veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 text-[#5B7067]">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Fresh ingredients, spices, and sides included..."
                  value={newDish.description}
                  onChange={e => setNewDish({ ...newDish, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F7FAF8]"
                />
              </div>

              <div>
                <label className="block mb-1 text-[#5B7067]">Daily Preparation Limit</label>
                <input 
                  type="number" 
                  value={newDish.limit}
                  onChange={e => setNewDish({ ...newDish, limit: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#E5ECE8] rounded-xl focus:outline-none focus:border-[#0A8B5F] bg-[#F7FAF8]"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/2 py-2.5 border border-[#E5ECE8] rounded-xl text-[#5B7067] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 py-2.5 bg-[#0A8B5F] text-white rounded-xl hover:bg-[#08734E] transition-colors cursor-pointer shadow-md"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
