const mongoose = require('mongoose');

const sampleItemsPerTiffin = {
  'Healthy Low-Cal High Protein Thali': [
    { category: 'Breads & Grains', name: 'Multigrain Rotis (Cold-Pressed Flaxseed)', unit: '2 pcs', defaultQuantity: 1, minQuantity: 1, maxQuantity: 4, unitPrice: 35, price: 35, isDefault: true, sortOrder: 1 },
    { category: 'Mains & Proteins', name: 'Fresh Paneer Tikka Cubes (Low Salt)', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 3, unitPrice: 50, price: 50, isDefault: true, sortOrder: 2 },
    { category: 'Mains & Proteins', name: 'Steamed Moong Sprouts Salad', unit: '1 cup', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 25, price: 25, isDefault: true, sortOrder: 3 },
    { category: 'Rice & Khichdi', name: 'Brown Rice Pulao with Herbs', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 25, price: 25, isDefault: true, sortOrder: 4 },
    { category: 'Accompaniments', name: 'Roasted Foxnut Makhana & Chaas', unit: '1 bottle', defaultQuantity: 1, minQuantity: 0, maxQuantity: 3, unitPrice: 15, price: 15, isDefault: true, sortOrder: 5 }
  ],
  'Gujarati Special Kathiyawadi Thali': [
    { category: 'Breads & Grains', name: 'Desi Ghee Phulka Rotis', unit: '4 pcs', defaultQuantity: 1, minQuantity: 1, maxQuantity: 4, unitPrice: 30, price: 30, isDefault: true, sortOrder: 1 },
    { category: 'Breads & Grains', name: 'Kathiyawadi Bajra Rotla with White Butter', unit: '1 pc', defaultQuantity: 0, minQuantity: 0, maxQuantity: 3, unitPrice: 25, price: 25, isDefault: false, sortOrder: 2 },
    { category: 'Curries & Sabzi', name: 'Sev Tameta Nu Shaak (Kathiyawadi)', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 3, unitPrice: 35, price: 35, isDefault: true, sortOrder: 3 },
    { category: 'Curries & Sabzi', name: 'Surti Undhiyu Special', unit: '1 bowl', defaultQuantity: 0, minQuantity: 0, maxQuantity: 2, unitPrice: 40, price: 40, isDefault: false, sortOrder: 4 },
    { category: 'Dal & Kadhi', name: 'Khatte-Mitthi Gujarati Dal', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 2, unitPrice: 25, price: 25, isDefault: true, sortOrder: 5 },
    { category: 'Rice & Khichdi', name: 'Steamed Basmati Rice with Jeera', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 20, price: 20, isDefault: true, sortOrder: 6 },
    { category: 'Accompaniments', name: 'Masala Chhaas & Roasted Papad', unit: '1 glass', defaultQuantity: 1, minQuantity: 0, maxQuantity: 3, unitPrice: 10, price: 10, isDefault: true, sortOrder: 7 }
  ],
  'Jain Pure Veg Swaminarayan Thali': [
    { category: 'Breads & Grains', name: 'Pure Ghee Phulka Rotis (Soft)', unit: '4 pcs', defaultQuantity: 1, minQuantity: 1, maxQuantity: 4, unitPrice: 35, price: 35, isDefault: true, sortOrder: 1 },
    { category: 'Curries & Sabzi', name: 'Swaminarayan Paneer Gravy (No Root Veg)', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 3, unitPrice: 45, price: 45, isDefault: true, sortOrder: 2 },
    { category: 'Dal & Kadhi', name: 'Satvik Moong Dal Tadka', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 2, unitPrice: 30, price: 30, isDefault: true, sortOrder: 3 },
    { category: 'Rice & Khichdi', name: 'Ghee Jeera Rice', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 20, price: 20, isDefault: true, sortOrder: 4 },
    { category: 'Accompaniments', name: 'Fresh Dahi & Jain Methi Sambharo', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 10, price: 10, isDefault: true, sortOrder: 5 }
  ],
  'Punjabi Butter Paneer Combo Thali': [
    { category: 'Breads & Grains', name: 'Butter Tawa Parathas', unit: '2 pcs', defaultQuantity: 1, minQuantity: 1, maxQuantity: 4, unitPrice: 40, price: 40, isDefault: true, sortOrder: 1 },
    { category: 'Curries & Sabzi', name: 'Paneer Butter Masala (Rich Cashew Gravy)', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 3, unitPrice: 55, price: 55, isDefault: true, sortOrder: 2 },
    { category: 'Dal & Kadhi', name: 'Dal Makhani Slow-Simmered Over Coal', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 2, unitPrice: 35, price: 35, isDefault: true, sortOrder: 3 },
    { category: 'Rice & Khichdi', name: 'Jeera Rice with Crispy Fried Onion', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 20, price: 20, isDefault: true, sortOrder: 4 },
    { category: 'Accompaniments', name: 'Warm Gulab Jamun & Boondi Raita', unit: '1 set', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 10, price: 10, isDefault: true, sortOrder: 5 }
  ],
  'Special Executive Mini Thali': [
    { category: 'Breads & Grains', name: 'Phulka Rotis with Cow Ghee', unit: '3 pcs', defaultQuantity: 1, minQuantity: 1, maxQuantity: 3, unitPrice: 25, price: 25, isDefault: true, sortOrder: 1 },
    { category: 'Curries & Sabzi', name: 'Daily Homestyle Sabzi (Aloo Gobi/Bhindi)', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 2, unitPrice: 30, price: 30, isDefault: true, sortOrder: 2 },
    { category: 'Dal & Kadhi', name: 'Yellow Dal Tadka', unit: '1 bowl', defaultQuantity: 1, minQuantity: 1, maxQuantity: 2, unitPrice: 24, price: 24, isDefault: true, sortOrder: 3 },
    { category: 'Rice & Khichdi', name: 'Steamed Basmati Rice', unit: '1 bowl', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 15, price: 15, isDefault: true, sortOrder: 4 },
    { category: 'Accompaniments', name: 'Crisp Papad & Mango Pickle', unit: '1 set', defaultQuantity: 1, minQuantity: 0, maxQuantity: 2, unitPrice: 5, price: 5, isDefault: true, sortOrder: 5 }
  ]
};

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/tiffinlink');
  const db = mongoose.connection.db;
  const tiffins = await db.collection('tiffins').find({}).toArray();
  console.log('Seeding items for', tiffins.length, 'tiffins...');

  await db.collection('tiffinitems').deleteMany({});

  let totalInserted = 0;
  for (const t of tiffins) {
    const list = sampleItemsPerTiffin[t.name] || sampleItemsPerTiffin['Gujarati Special Kathiyawadi Thali'];
    const docs = list.map(item => ({
      ...item,
      tiffinId: new mongoose.Types.ObjectId(t._id),
      providerId: String(t.providerId),
      availableQuantity: 25,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await db.collection('tiffinitems').insertMany(docs);
    totalInserted += docs.length;

    await db.collection('tiffins').updateOne(
      { _id: t._id },
      { $set: { items: list.map(i => i.name) } }
    );
  }

  console.log('Successfully inserted', totalInserted, 'items into tiffinitems collection!');
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
