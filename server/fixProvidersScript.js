const mongoose = require('mongoose');
const Provider = require('./src/models/Provider');

async function fix() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');
  
  await Provider.findByIdAndUpdate('6a7ebb44019deec85d9fa391', { name: "Mom's Kitchen", businessName: "Mom's Kitchen" });
  await Provider.findByIdAndUpdate('6a7ebb44019deec85d9fa393', { name: 'Ghar Ka Khana', businessName: 'Ghar Ka Khana' });
  await Provider.findByIdAndUpdate('6a7ebb44019deec85d9fa394', { name: 'Shree Tiffin Service', businessName: 'Shree Tiffin Service' });
  await Provider.findByIdAndUpdate('6a7ebb44019deec85d9fa395', { name: 'Foodie Home Kitchen', businessName: 'Foodie Home Kitchen' });
  await Provider.findByIdAndUpdate('6a7f3051d4b48741d8722416', { name: 'Mansuri Kitchen', businessName: 'Mansuri Kitchen', price: 120 });
  
  console.log('Successfully restored distinct Provider documents in MongoDB!');
  await mongoose.disconnect();
}

fix();
