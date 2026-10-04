const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);

    const Provider = mongoose.model('Provider', new mongoose.Schema({}, { strict: false }));
    const Tiffin = mongoose.model('Tiffin', new mongoose.Schema({}, { strict: false }));
    const TiffinItem = mongoose.model('TiffinItem', new mongoose.Schema({}, { strict: false }));

    // Find Mansuri Kitchen
    let mansuri = await Provider.findOne({ 
      $or: [
        { name: /Mansuri/i },
        { businessName: /Mansuri/i },
        { email: /mansuri/i }
      ]
    });

    if (!mansuri) {
      console.log('Mansuri kitchen not found by name, looking for first provider...');
      mansuri = await Provider.findOne({});
    }

    if (!mansuri) {
      console.error('No provider found in database!');
      process.exit(1);
    }

    const mansuriId = mansuri._id.toString();
    console.log('Using Mansuri Kitchen ID:', mansuriId, mansuri.name);

    // Update Mansuri Kitchen details if needed
    await Provider.findByIdAndUpdate(mansuri._id, {
      name: 'Mansuri Kitchen',
      businessName: 'Mansuri Kitchen',
      description: 'Mindfully slow-cooked home dining, rooted in multi-generational Ahmedabad culinary heritage. Pure Satvik oil-balanced preparations crafted with zero additives, cold-pressed groundnut oil, and fresh stone-ground spice blends.',
      rating: 4.8,
      price: 140,
      tags: ['Veg', 'Jain Friendly', 'Home Kitchen', 'Satvik Pure Veg'],
      status: 'active',
      isAcceptingOrders: true,
      maxCapacity: 45,
      fssaiNumber: '208240091823',
      address: {
        houseNo: 'B-104',
        street: 'Heritage Heights, Satellite Road',
        locality: 'Satellite',
        city: 'Ahmedabad',
        pincode: '380015',
        lat: 23.0300,
        lng: 72.5178,
        isLocationPinned: true
      },
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7hoPsyOHMXxV4J543NdSXFNSDHhCslvatggHYER30u5ITFTRxhvO7OxJSe712C1FWAEbcE1jYNEVPOHOoR38N1rlm5w5wxumEbFBHUpYg5Sy_6YnxtC__bx9bGaH0ZRA1ZykZXsGJjoreSOhsFZFbzTdljqCesVoTDUhERFaKzxsAgE5xx8_GBaVMqWeCyp6bfAFUyW5P4bIncxVyG3tXZ6p0R38Bzlb_N1YN1fj_jaQi9H9nuotU'
    });

    // Clean existing tiffins and items for Mansuri Kitchen
    await Tiffin.deleteMany({ providerId: mansuriId });
    await TiffinItem.deleteMany({ providerId: mansuriId });

    // 1. Gujarati Special Tiffin
    const gujTiffin = await Tiffin.create({
      providerId: mansuriId,
      name: 'Gujarati Special Tiffin',
      description: 'Traditional home-style Gujarati meal prepared fresh in pure cold-pressed groundnut oil with zero industrial preservatives, packed into tiered surgical-grade stainless canisters.',
      price: 140,
      monthlyPrice: 3640,
      weeklyPrice: 899,
      isSubscriptionOnly: false,
      category: 'Gujarati Traditional',
      foodType: 'Veg',
      mealType: 'Lunch',
      startTime: '12:00 PM',
      endTime: '02:00 PM',
      orderCutoff: '11:45 AM',
      capacity: 35,
      available: 14,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: 'Satellite, Ahmedabad',
      ingredients: 'Sharbati Wheat Flour, Fresh Tomatoes, Sev, Tuver Dal, Aged Basmati Rice, Desi Cow Ghee',
      items: [
        '4 Phulka Rotli (Stone-ground Sharbati Wheat)',
        'Sev Tameta Nu Shaak (Sweet-tangy tomato)',
        'Gujarati Toor Dal (Cumin & Jaggery tempered)',
        'Jeera Rice & Kachumber Salad'
      ],
      ordersToday: 21,
      rating: 4.8,
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCMu_TVgTec0S1wQHIMMwrELkw3t1LX664GkNNa9BT258VzR9SyXuP-XB5KYIGq_KZVXp1A5qIcS4ooyOIfdEsA87ygeKHaE6foMiv-C3yyM21VcGBWEnvu8WvL-RQFZZCXkE0OTNxmoEQF_tdo0sj5L0-0wTY238PdytDxl_KerGP8fiigXMye8nczTLWNQYaTsD1-Ud3QDfxvSghCcVy1TIzjU_6sLPwbEMb1Ras9rHO-tsMIYxzw'
    });

    const gujItems = [
      // Breads
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Breads',
        name: 'Rotli / Chapati',
        description: 'Thin soft wheat flatbread layered with pure A2 cow ghee.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGRgaxVrE8q8q3IQCZloNg8V6MG2ZCXMDVJndcBOo-YmJsB6R9kNYMW5PshO6V-EuD7W659LSx23vbxFYkqqWdCkf_oRXKJB1gYsIw2zgAvsgHvQohlNsdH-GjZWbW60mGza80s4D7M3LGXIFb75OULJScD7_FdZ688ySNkkDhECgqNhWrjI0P_y48sTHI5kGzQsRujoCzeqzdq_KLBhObb8AZZOSwQrUUoXkSKDDCJcnc7qrKGYHi',
        unit: 'piece',
        defaultQuantity: 2,
        minQuantity: 0,
        maxQuantity: 10,
        price: 8,
        unitPrice: 8,
        availableQuantity: 42,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 1
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Breads',
        name: 'Thepla',
        description: 'Fresh methi (fenugreek leaves), crushed ajwain, sesame seeds & gentle turmeric.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCGRgaxVrE8q8q3IQCZloNg8V6MG2ZCXMDVJndcBOo-YmJsB6R9kNYMW5PshO6V-EuD7W659LSx23vbxFYkqqWdCkf_oRXKJB1gYsIw2zgAvsgHvQohlNsdH-GjZWbW60mGza80s4D7M3LGXIFb75OULJScD7_FdZ688ySNkkDhECgqNhWrjI0P_y48sTHI5kGzQsRujoCzeqzdq_KLBhObb8AZZOSwQrUUoXkSKDDCJcnc7qrKGYHi',
        unit: 'piece',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 8,
        price: 15,
        unitPrice: 15,
        availableQuantity: 18,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 2
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Breads',
        name: 'Puri',
        description: 'Golden whole wheat crispy puffed puris fried in cold-pressed oil.',
        image: '',
        unit: 'piece',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 8,
        price: 10,
        unitPrice: 10,
        availableQuantity: 0,
        isDefault: false,
        isAvailable: false,
        isCustomizable: true,
        sortOrder: 3
      },
      // Vegetable Curries
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Vegetable Curries',
        name: 'Sev Tameta',
        description: 'Sweet & tangy Kathiyawadi spiced tomato gravy crowned with crisp Ratlami sev.',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDc002zHgZXV00Hm7p_-YOt0fI-Pm1kdK5QKU1uoLKgDdWkd3-4YFzrLsMPLKcg4b0l_bcKdSW5a55iSJEx7N68Bz9iDGVQzi8UH-8Qnwexo0IEpDc3i3H0GqARCY7YGenkuXjMpMqJg3OB9xZOKKhDvEdR4EPDmkeFJKwc7afL-bm6IVuby4mDKk4LHIJYnS4N8bTKXYxFkLOTqv-rDIdo08xGzXtmhMsegbgRLGyyP3tC-mld7mS5',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 5,
        price: 40,
        unitPrice: 40,
        availableQuantity: 15,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 4
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Vegetable Curries',
        name: 'Undhiyu',
        description: 'Surti winter slow-cooked delicacy with surti papdi, purple yam, baby eggplant & fenugreek muthiya.',
        image: '',
        unit: 'portion',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 5,
        price: 50,
        unitPrice: 50,
        availableQuantity: 10,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 5
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Vegetable Curries',
        name: 'Bhindi Sambhariya',
        description: 'Tender okra slit and stuffed with roasted gram flour, sesame seeds and gentle raw mango powder.',
        image: '',
        unit: 'portion',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 5,
        price: 35,
        unitPrice: 35,
        availableQuantity: 12,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 6
      },
      // Dal & Kadhi
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Dal & Kadhi',
        name: 'Gujarati Dal',
        description: 'Harmonious sweet & sour tuver dal tempered with cinnamon, cloves, peanuts & dried kokum.',
        image: '',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 35,
        unitPrice: 35,
        availableQuantity: 20,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 7
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Dal & Kadhi',
        name: 'Gujarati Kadhi',
        description: 'Silky, delicate curd and besan broth balanced with ginger, green chilli, and fresh curry leaves.',
        image: '',
        unit: 'portion',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 4,
        price: 30,
        unitPrice: 30,
        availableQuantity: 15,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 8
      },
      // Rice
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Rice',
        name: 'Jeera Rice',
        description: 'Aged long-grain basmati rice tossed in ghee-roasted cumin seeds and whole cloves.',
        image: '',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 30,
        unitPrice: 30,
        availableQuantity: 25,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 9
      },
      // Accompaniments & Addons
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Accompaniments',
        name: 'Extra Earthen Matka Chaas (250ml)',
        description: 'Chilled hand-churned buttermilk with cumin & Himalayan rock salt.',
        image: '',
        unit: 'glass',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 4,
        price: 25,
        unitPrice: 25,
        availableQuantity: 20,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 10
      },
      {
        tiffinId: gujTiffin._id,
        providerId: mansuriId,
        category: 'Sweets',
        name: 'Sweet of the Day: Mohanthal (70g)',
        description: 'Authentic coarse gram flour sweet roasted slow in pure Gir cow ghee.',
        image: '',
        unit: 'piece',
        defaultQuantity: 0,
        minQuantity: 0,
        maxQuantity: 3,
        price: 45,
        unitPrice: 45,
        availableQuantity: 14,
        isDefault: false,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 11
      }
    ];

    await TiffinItem.insertMany(gujItems);
    console.log('Seeded Gujarati Special Tiffin items:', gujItems.length);

    // 2. Jain Special Tiffin
    const jainTiffin = await Tiffin.create({
      providerId: mansuriId,
      name: 'Jain Special Tiffin',
      description: 'Strict Satvik Jain meal crafted without root vegetables, onion, or garlic. Cooked in designated pure brass and stainless steel vessels with A2 Gir cow ghee.',
      price: 150,
      monthlyPrice: 3900,
      weeklyPrice: 950,
      isSubscriptionOnly: false,
      category: 'Strict Jain',
      foodType: 'Jain',
      mealType: 'Lunch',
      startTime: '12:00 PM',
      endTime: '02:00 PM',
      orderCutoff: '11:30 AM',
      capacity: 25,
      available: 6,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: 'Satellite, Ahmedabad',
      ingredients: 'Organic Sharbati Wheat, Dudhi, Yellow Moong Dal, Steamed Basmati, A2 Cow Ghee',
      items: [
        '4 Sada Phulkas (A2 Gir Cow Ghee)',
        'Dudhi Nu Shaak (Fresh bottle gourd)',
        'Yellow Moong Dal (Tempered with Hing & Ghee)',
        'Steamed Basmati Rice & Fresh Chaas'
      ],
      ordersToday: 19,
      rating: 4.8,
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALL9P29qX9nOtbETPkhsF7OUY2W71CC0_9a8ppDvyo3i2vxr6eYZYntKAPbcic9zhmHV-owfYPnQRQ_owyF0lStSEDGWUX04L3qL_rRh3dGx7cpn32PysFzvw6f_vJNWOyI6Xa0B-9y5HA5duroMhxIn1kCqlFthQF9t_JyKm6Q7a0SuDoY_9f5HAb-WRkMZQ4W2BV06zUSTY8EkoJ9TyWcJKYJYh4WLlNtle0tAUrnTE6xOO4Mg37'
    });

    const jainItems = [
      {
        tiffinId: jainTiffin._id,
        providerId: mansuriId,
        category: 'Breads',
        name: 'Sada Phulkas (A2 Gir Cow Ghee)',
        description: 'Tender wheat rotli brushed with golden A2 Gir cow ghee.',
        unit: 'piece',
        defaultQuantity: 4,
        minQuantity: 0,
        maxQuantity: 10,
        price: 8,
        unitPrice: 8,
        availableQuantity: 30,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 1
      },
      {
        tiffinId: jainTiffin._id,
        providerId: mansuriId,
        category: 'Vegetable Curries',
        name: 'Dudhi Nu Shaak',
        description: 'Fresh farm-sourced bottle gourd mildly spiced with cumin, hing and rock salt.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 5,
        price: 40,
        unitPrice: 40,
        availableQuantity: 15,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 2
      },
      {
        tiffinId: jainTiffin._id,
        providerId: mansuriId,
        category: 'Dal & Kadhi',
        name: 'Yellow Moong Dal (Tempered with Hing & Ghee)',
        description: 'Easily digestible yellow moong lentils tempered in desi ghee.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 35,
        unitPrice: 35,
        availableQuantity: 20,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 3
      },
      {
        tiffinId: jainTiffin._id,
        providerId: mansuriId,
        category: 'Rice',
        name: 'Steamed Basmati Rice',
        description: 'Aromatic long-grain steamed white rice.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 30,
        unitPrice: 30,
        availableQuantity: 20,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 4
      },
      {
        tiffinId: jainTiffin._id,
        providerId: mansuriId,
        category: 'Accompaniments',
        name: 'Fresh Chaas (Clay Pot Churned)',
        description: 'Digestive buttermilk with roasted cumin and mint.',
        unit: 'glass',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 15,
        unitPrice: 15,
        availableQuantity: 25,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 5
      }
    ];

    await TiffinItem.insertMany(jainItems);
    console.log('Seeded Jain Special Tiffin items:', jainItems.length);

    // 3. Kathiyawadi Ringan Olo & Rotla
    const kathiTiffin = await Tiffin.create({
      providerId: mansuriId,
      name: 'Kathiyawadi Ringan Olo & Rotla Special',
      description: 'Rustic Saurashtra dinner featuring hand-patted clay tawa roasted Bajra Rotlas with organic homemade white butter and charcoal-smoked aubergine bharta.',
      price: 180,
      monthlyPrice: 4500,
      weeklyPrice: 1150,
      isSubscriptionOnly: false,
      category: 'Kathiyawadi',
      foodType: 'Veg',
      mealType: 'Dinner',
      startTime: '07:00 PM',
      endTime: '09:00 PM',
      orderCutoff: '06:15 PM',
      capacity: 30,
      available: 12,
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: 'Satellite, Ahmedabad',
      ingredients: 'Pearl Millet (Bajra), Eggplant, Garlic, Surati Kadhi, Khichdi, White Butter',
      items: [
        '2 Bajra Rotla (Clay Tawa Roasted, White Makhan)',
        'Ringan No Olo (Charcoal Roasted Aubergine)',
        'Surati Kadhi & Steamed Khichdi',
        'Lasan Chutney & Earthen Matka Chaas'
      ],
      ordersToday: 18,
      rating: 4.9,
      status: 'Active',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs5gW8mHVYuHPeX_s8wbG8BUkrPtLAPxqCAnZ5RHS4ETkuyWSw53l-ieyvAcaZ2aYbCUB245YvCVE3pliclCnrT1shVrCjIOb_Iu46Y5p-zfOonLcB_BB_A9RPIEfHGA-vcOYJJZhTTczbpqhOLgLw5qmAdDI1nXj8sDj9eed8SUyMmZBueoH-KgF4cl02MiPqz4xv3ZhSkoPZNKTbn3zX-o4IR_A5yH2qS4Fw848zBCaSGfm0CGrv'
    });

    const kathiItems = [
      {
        tiffinId: kathiTiffin._id,
        providerId: mansuriId,
        category: 'Breads',
        name: 'Bajra Rotla (Clay Tawa Roasted)',
        description: 'Thick organic pearl millet bread roasted over clay griddle, glazed with white butter.',
        unit: 'piece',
        defaultQuantity: 2,
        minQuantity: 0,
        maxQuantity: 6,
        price: 25,
        unitPrice: 25,
        availableQuantity: 20,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 1
      },
      {
        tiffinId: kathiTiffin._id,
        providerId: mansuriId,
        category: 'Vegetable Curries',
        name: 'Ringan No Olo (Charcoal Aubergine Mash)',
        description: 'Fire roasted smoky eggplant simmered with spring onions, garlic and red chillies.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 50,
        unitPrice: 50,
        availableQuantity: 15,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 2
      },
      {
        tiffinId: kathiTiffin._id,
        providerId: mansuriId,
        category: 'Dal & Kadhi',
        name: 'Surati Kadhi & Steamed Khichdi',
        description: 'Sweet spiced buttermilk kadhi with comforting moong dal khichdi.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 40,
        unitPrice: 40,
        availableQuantity: 15,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 3
      },
      {
        tiffinId: kathiTiffin._id,
        providerId: mansuriId,
        category: 'Accompaniments',
        name: 'Lasan Chutney (Fiery Garlic Dip)',
        description: 'Mortar pestle pounded dry garlic and Mathania red chillies.',
        unit: 'portion',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 3,
        price: 15,
        unitPrice: 15,
        availableQuantity: 25,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 4
      },
      {
        tiffinId: kathiTiffin._id,
        providerId: mansuriId,
        category: 'Accompaniments',
        name: 'Earthen Matka Chaas',
        description: 'Slow churned clay pot buttermilk with roasted cumin.',
        unit: 'glass',
        defaultQuantity: 1,
        minQuantity: 0,
        maxQuantity: 4,
        price: 20,
        unitPrice: 20,
        availableQuantity: 25,
        isDefault: true,
        isAvailable: true,
        isCustomizable: true,
        sortOrder: 5
      }
    ];

    await TiffinItem.insertMany(kathiItems);
    console.log('Seeded Kathiyawadi Tiffin items:', kathiItems.length);

    // Seed other providers with their own authentic tiffins
    const otherProviders = await Provider.find({ _id: { $ne: mansuri._id } });
    console.log('Seeding other providers:', otherProviders.length);

    for (const op of otherProviders) {
      const opId = op._id.toString();
      await Tiffin.deleteMany({ providerId: opId });
      await TiffinItem.deleteMany({ providerId: opId });

      let tName = `${op.name} Daily Thali`;
      let tCategory = 'Homestyle Thali';
      let tPrice = op.price || 125;

      if (op.name.includes('Shree')) {
        tName = 'Balanced Sattvic Thali';
        tCategory = 'Sattvic Pure Veg';
        tPrice = 125;
      } else if (op.name.includes('Ghar')) {
        tName = 'Rajasthani Panchmel Thali';
        tCategory = 'Rajasthani / Gujarati';
        tPrice = 110;
      } else if (op.name.includes('Foodie')) {
        tName = 'Deluxe Punjabi Paneer Thali';
        tCategory = 'Punjabi Deluxe';
        tPrice = 140;
      }

      const opTiffin = await Tiffin.create({
        providerId: opId,
        name: tName,
        description: op.description || 'Nutritious homestyle thali prepared fresh daily.',
        price: tPrice,
        monthlyPrice: tPrice * 26,
        weeklyPrice: tPrice * 6,
        isSubscriptionOnly: false,
        category: tCategory,
        foodType: op.tags?.[0] || 'Veg',
        mealType: 'Lunch',
        capacity: op.maxCapacity || 30,
        available: Math.max(8, (op.maxCapacity || 30) - 10),
        rating: op.rating || 4.7,
        status: 'Active',
        image: op.image || '/assets/provider_1.png'
      });

      const opItems = [
        {
          tiffinId: opTiffin._id,
          providerId: opId,
          category: 'Breads',
          name: 'Fresh Phulkas (4 Pcs)',
          description: 'Whole wheat soft flatbreads',
          unit: 'portion',
          defaultQuantity: 1,
          minQuantity: 0,
          maxQuantity: 4,
          price: 24,
          unitPrice: 24,
          availableQuantity: 30,
          isDefault: true,
          isAvailable: true,
          isCustomizable: true,
          sortOrder: 1
        },
        {
          tiffinId: opTiffin._id,
          providerId: opId,
          category: 'Vegetable Curries',
          name: 'Chef Special Sabzi of the Day',
          description: 'Seasonal vegetable preparation',
          unit: 'portion',
          defaultQuantity: 1,
          minQuantity: 0,
          maxQuantity: 3,
          price: 45,
          unitPrice: 45,
          availableQuantity: 20,
          isDefault: true,
          isAvailable: true,
          isCustomizable: true,
          sortOrder: 2
        },
        {
          tiffinId: opTiffin._id,
          providerId: opId,
          category: 'Dal & Kadhi',
          name: 'Homestyle Dal',
          description: 'Slow-cooked lentil soup',
          unit: 'portion',
          defaultQuantity: 1,
          minQuantity: 0,
          maxQuantity: 3,
          price: 35,
          unitPrice: 35,
          availableQuantity: 20,
          isDefault: true,
          isAvailable: true,
          isCustomizable: true,
          sortOrder: 3
        },
        {
          tiffinId: opTiffin._id,
          providerId: opId,
          category: 'Rice',
          name: 'Steamed Basmati Rice',
          description: 'Fluffy long-grain rice',
          unit: 'portion',
          defaultQuantity: 1,
          minQuantity: 0,
          maxQuantity: 3,
          price: 30,
          unitPrice: 30,
          availableQuantity: 25,
          isDefault: true,
          isAvailable: true,
          isCustomizable: true,
          sortOrder: 4
        }
      ];

      await TiffinItem.insertMany(opItems);
      console.log(`Seeded tiffin and items for ${op.name}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
