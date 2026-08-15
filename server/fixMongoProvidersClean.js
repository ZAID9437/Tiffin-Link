const mongoose = require('mongoose');
const Provider = require('./src/models/Provider');

async function fixAllProviders() {
  await mongoose.connect('mongodb://localhost:27017/tiffinlink');

  // Provider 5 - User's Real Registered Provider Account
  await Provider.findByIdAndUpdate('6a7f3051d4b48741d8722416', {
    name: "Mansuri Kitchen",
    businessName: "Mansuri Kitchen",
    fullName: "Xoxo Men",
    email: "menxoxo50@gmail.com",
    mobile: "+91 1234567890",
    description: "Healthy And Delicious Food",
    opens: "10:00",
    closes: "12:00",
    bankName: "abc bank",
    accountNumber: "1234567890",
    ifscCode: "abconrff",
    upiId: "zaidupi@abcbank",
    image: "/assets/provider_1.png",
    kitchenPhotos: "/assets/provider_1.png",
    price: 120
  });

  console.log('--- MANSUORI KITCHEN CARD IMAGE UPDATED IN MONGODB ---');
  await mongoose.disconnect();
}

fixAllProviders();
