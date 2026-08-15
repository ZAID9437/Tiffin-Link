const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Provider = require('./models/Provider');
const User = require('./models/User');
const Otp = require('./models/Otp');
const MealRequest = require('./models/MealRequest');
const ContactInquiry = require('./models/ContactInquiry');

const defaultProviders = [
  {
    name: "Mom's Kitchen",
    description: "Home-style Gujarati Food",
    rating: 4.9,
    eta: "30-40 min",
    price: 100,
    tags: ["Pure Veg"],
    image: "/assets/provider_1.png"
  },
  {
    name: "Healthy Meals Kitchen",
    description: "High Protein & Healthy Meals",
    rating: 4.8,
    eta: "25-35 min",
    price: 110,
    tags: ["Pure Veg"],
    image: "/assets/provider_2.png"
  },
  {
    name: "Ghar Ka Khana",
    description: "Authentic Homemade Food",
    rating: 4.7,
    eta: "20-30 min",
    price: 100,
    tags: ["Jain Food"],
    image: "/assets/provider_3.png"
  },
  {
    name: "Shree Tiffin Service",
    description: "Simple, Hygienic & Tasty",
    rating: 4.9,
    eta: "30-40 min",
    price: 90,
    tags: ["Pure Veg"],
    image: "/assets/provider_4.png"
  },
  {
    name: "Foodie Home Kitchen",
    description: "Variety Thalis & Tiffins",
    rating: 4.6,
    eta: "35-45 min",
    price: 120,
    tags: ["Veg & Non-Veg"],
    image: "/assets/provider_5.png"
  }
];

async function seedDB() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/tiffinlink';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully!');

    // 1. Seed Providers if empty
    const providerCount = await Provider.countDocuments();
    if (providerCount === 0) {
      await Provider.insertMany(defaultProviders);
      console.log('Seeded initial Providers into MongoDB.');
    } else {
      console.log(`Providers collection already has ${providerCount} documents.`);
    }

    // 2. Ensure indexes on Otp and User collections
    await Otp.createIndexes();
    await User.createIndexes();

    console.log('\n--- MongoDB Collections initialized ---');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => console.log(`- Collection: ${col.name}`));

    console.log('\nMongoDB setup and verification complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error connecting/seeding MongoDB:', error);
    process.exit(1);
  }
}

seedDB();
