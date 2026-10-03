import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiRequest } from '../services/api';

// Default authentic regional items for categories that may not have custom items in DB
const DEFAULT_HOMESTYLE_ITEMS = {
  breads: [
    { id: 'def-rotli', name: 'Rotli (Phulka with Desi Gir Ghee)', category: 'Breads', description: 'Thin, hand-rolled whole wheat puff • 4 pieces included with standard thali', price: 0, defaultQty: 4, minQty: 1, maxQty: 10, isIncluded: true },
    { id: 'def-puri', name: 'Puri (Whole Wheat Golden Crispy)', category: 'Breads', description: 'Fried in single-use groundnut oil', price: 15, defaultQty: 2, minQty: 0, maxQty: 8, isIncluded: false },
    { id: 'def-rotla', name: 'Bajra na Rotla with White Butter (Makhan)', category: 'Breads', description: 'Thick earthenware baked pearl millet bread with homemade white butter', price: 25, defaultQty: 0, minQty: 0, maxQty: 4, isIncluded: false }
  ],
  shaak: [
    { id: 'def-sev-tameta', name: 'Sev Tameta Nu Shaak', category: 'Vegetable Curries', description: 'Sweet, sour & spicy Kathiyawadi preparation topped with crispy sev.', price: 30, tag: 'Kathiyawadi Classic' },
    { id: 'def-undhiyu', name: 'Surti Undhiyu', category: 'Vegetable Curries', description: 'Winter special slow-cooked mixed greens, root veg & fenugreek muthiyas.', price: 40, tag: 'Signature Heritage' },
    { id: 'def-olo', name: 'Ringna No Olo', category: 'Vegetable Curries', description: 'Charcoal fire roasted spiced eggplant mash with garlic cloves & spring onions.', price: 35, tag: 'Smoked Earth' },
    { id: 'def-bhindi', name: 'Bhindi Sambhariya', category: 'Vegetable Curries', description: 'Tender okra stuffed with freshly ground coconut, roasted sesame & peanut crumble.', price: 30, tag: 'Dry Spiced' }
  ],
  dalKadhi: [
    { id: 'def-dal', name: 'Gujarati Tuver Dal', category: 'Dal & Kadhi', description: 'Sweet & tangy slow-simmered pigeon pea stew with organic kokum, jaggery, peanuts & curry leaves.', price: 25, isIncluded: true },
    { id: 'def-kadhi', name: 'Silky Gujarati Kadhi', category: 'Dal & Kadhi', description: 'Silky sour buttermilk broth delicately sweetened with raw jaggery, spiked with crushed ginger & cinnamon.', price: 25, isIncluded: false }
  ],
  rice: [
    { id: 'def-jeera-rice', name: 'Steamed Jeera Basmati Rice', category: 'Rice & Khichdi', description: 'Aromatic long grain basmati rice tempered with cumin & cow ghee.', price: 25, isIncluded: true },
    { id: 'def-khichdi', name: 'Kathiyawadi Vaghareli Khichdi', category: 'Rice & Khichdi', description: 'Tender moong dal and rice mash tempered with garlic, clove, and mustard oil.', price: 30, isIncluded: false }
  ],
  farsan: [
    { id: 'def-dhokla', name: 'Nylon Khaman Dhokla (2 pcs)', category: 'Farsan', description: 'Spongy gram flour steamed cubes tempered with green chilli & crackled mustard', price: 20, defaultQty: 2, minQty: 0, maxQty: 6 },
    { id: 'def-muthiya', name: 'Crispy Methi Muthiya (4 pcs)', category: 'Farsan', description: 'Steamed & pan-crisped fenugreek and whole wheat dumplings', price: 25, defaultQty: 0, minQty: 0, maxQty: 6 }
  ],
  accompaniments: [
    { id: 'def-chaas', name: 'Masala Chaas (250ml)', category: 'Accompaniments', description: 'Earthen clay pot buttermilk with roasted jeera & fresh pudina.', price: 15, isDefault: true },
    { id: 'def-sambharo', name: 'Marcha Sambharo & Achar', category: 'Accompaniments', description: 'Stir-fried mild green chillies with raw papaya shreds and mango pickle.', price: 0, isDefault: true, freeLabel: 'Free In Tiffin' },
    { id: 'def-thecha', name: 'Lasan Nu Thechu', category: 'Accompaniments', description: 'Mortar-pestle crushed red chilli & roasted garlic paste (Extra fiery).', price: 10, isDefault: false }
  ],
  sweets: [
    { id: 'def-shrikhand', name: 'Kesar Elaichi Shrikhand (100g)', category: 'Sweets', description: 'Pure hung curd churned with Kashmir saffron threads and green cardamom.', price: 30, isDefault: false },
    { id: 'def-mohanthal', name: 'Traditional Mohanthal (2 pcs)', category: 'Sweets', description: 'Ghee-roasted coarse besan fudge with almond slivers and silver vark.', price: 35, isDefault: false }
  ]
};

export default function TiffinCustomizer({
  tiffin,
  provider,
  onBack,
  onCheckout,
  currentUser,
  onOpenLogin
}) {
  // Live Data Fetched from MongoDB
  const [dbItems, setDbItems] = useState([]);
  const [dbProvider, setDbProvider] = useState(provider || null);
  const [dbTiffin, setDbTiffin] = useState(tiffin || null);
  const [loading, setLoading] = useState(true);

  // Customization Selections
  const [breadCounts, setBreadCounts] = useState({});
  const [selectedShaakId, setSelectedShaakId] = useState('');
  const [selectedDalIds, setSelectedDalIds] = useState({});
  const [selectedRiceId, setSelectedRiceId] = useState('');
  const [farsanCounts, setFarsanCounts] = useState({});
  const [selectedAccompaniments, setSelectedAccompaniments] = useState({});
  const [selectedSweets, setSelectedSweets] = useState({});
  const [instructions, setInstructions] = useState('Less spicy in Sev Tameta, please add extra roasted jeera to chaas.');

  // Order & Checkout States
  const [paymentMethod, setPaymentMethod] = useState('upi-escrow');
  const [deliveryAddress, setDeliveryAddress] = useState(
    currentUser?.address || '402 Prerna Apts, Near Judges Bungalow, Bodakdev, Ahmedabad'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // 1. Fetch live Tiffin, Provider & Tiffin Items from MongoDB
  const fetchCustomizerData = useCallback(async () => {
    try {
      setLoading(true);
      const targetTiffinId = tiffin?.id || tiffin?._id;
      const targetProviderId = provider?.id || provider?._id || tiffin?.providerId;

      // 1. Fetch Provider if ID present
      if (targetProviderId) {
        try {
          const pRes = await apiRequest(`/providers/${targetProviderId}`);
          if (pRes?.success && pRes.data) {
            setDbProvider(pRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch provider from DB, using fallback prop:', e);
        }
      }

      // 2. Fetch Tiffin if needed
      if (targetTiffinId) {
        try {
          const tRes = await apiRequest(`/tiffins/${targetTiffinId}`);
          if (tRes?.success && tRes.data) {
            setDbTiffin(tRes.data);
          }
        } catch (e) {
          console.warn('Could not fetch tiffin from DB, using fallback prop:', e);
        }

        // 3. Fetch Tiffin Items for this exact Tiffin
        try {
          const itemsRes = await apiRequest(`/tiffin-items?tiffinId=${targetTiffinId}`);
          if (itemsRes?.success && Array.isArray(itemsRes.data)) {
            setDbItems(itemsRes.data.map(i => ({ ...i, id: i._id || i.id })));
          }
        } catch (e) {
          console.warn('Could not fetch tiffin items from DB:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching customizer data:', err);
    } finally {
      setLoading(false);
    }
  }, [tiffin, provider]);

  useEffect(() => {
    fetchCustomizerData();
  }, [fetchCustomizerData]);

  // Dynamic Categorized Items (Merges DB Items with fallback items)
  const categorized = useMemo(() => {
    // Check if DB has items in each category
    const filterCat = (catNames) => {
      return dbItems.filter(i => 
        catNames.some(cn => i.category?.toLowerCase() === cn.toLowerCase()) ||
        catNames.some(cn => i.name?.toLowerCase().includes(cn.toLowerCase()))
      );
    };

    const dbBreads = filterCat(['Breads', 'Bread', 'Roti', 'Rotla', 'Puri']);
    const dbShaak = filterCat(['Vegetable Curries', 'Shaak', 'Sabzi', 'Curry']);
    const dbDal = filterCat(['Dal & Kadhi', 'Dal', 'Kadhi']);
    const dbRice = filterCat(['Rice & Khichdi', 'Rice', 'Khichdi', 'Grains']);
    const dbFarsan = filterCat(['Farsan', 'Snacks']);
    const dbAccomp = filterCat(['Accompaniments', 'Sides', 'Chutney', 'Chaas']);
    const dbSweets = filterCat(['Sweets', 'Mithai', 'Dessert']);

    return {
      breads: dbBreads.length > 0 ? dbBreads.map(b => ({
        id: b.id,
        name: b.name,
        category: 'Breads',
        description: b.description || 'Freshly prepared tawa item',
        price: b.price !== undefined ? b.price : (b.unitPrice || 0),
        defaultQty: b.defaultQuantity || 2,
        minQty: b.minQuantity ?? 0,
        maxQty: b.maxQuantity ?? 8,
        isIncluded: b.isDefault ?? false
      })) : DEFAULT_HOMESTYLE_ITEMS.breads,

      shaak: dbShaak.length > 0 ? dbShaak.map(s => ({
        id: s.id,
        name: s.name,
        category: 'Vegetable Curries',
        description: s.description || 'Cooked in authentic cold-pressed oil with traditional spices',
        price: s.price !== undefined ? s.price : (s.unitPrice || 30),
        tag: s.isDefault ? 'Signature' : 'Classic'
      })) : DEFAULT_HOMESTYLE_ITEMS.shaak,

      dalKadhi: dbDal.length > 0 ? dbDal.map(d => ({
        id: d.id,
        name: d.name,
        category: 'Dal & Kadhi',
        description: d.description || 'Slow-simmered home preparation with whole spices',
        price: d.price !== undefined ? d.price : (d.unitPrice || 25),
        isIncluded: d.isDefault ?? true
      })) : DEFAULT_HOMESTYLE_ITEMS.dalKadhi,

      rice: dbRice.length > 0 ? dbRice.map(r => ({
        id: r.id,
        name: r.name,
        category: 'Rice & Khichdi',
        description: r.description || 'Steamed aromatic grain preparation',
        price: r.price !== undefined ? r.price : (r.unitPrice || 25),
        isIncluded: r.isDefault ?? true
      })) : DEFAULT_HOMESTYLE_ITEMS.rice,

      farsan: dbFarsan.length > 0 ? dbFarsan.map(f => ({
        id: f.id,
        name: f.name,
        category: 'Farsan',
        description: f.description || 'Steamed artisanal snack',
        price: f.price !== undefined ? f.price : (f.unitPrice || 20),
        defaultQty: f.defaultQuantity || 1,
        minQty: 0,
        maxQty: 6
      })) : DEFAULT_HOMESTYLE_ITEMS.farsan,

      accompaniments: dbAccomp.length > 0 ? dbAccomp.map(a => ({
        id: a.id,
        name: a.name,
        category: 'Accompaniments',
        description: a.description || 'Fresh side accompaniment',
        price: a.price !== undefined ? a.price : (a.unitPrice || 15),
        isDefault: a.isDefault ?? true,
        freeLabel: a.price === 0 ? 'Free In Tiffin' : undefined
      })) : DEFAULT_HOMESTYLE_ITEMS.accompaniments,

      sweets: dbSweets.length > 0 ? dbSweets.map(sw => ({
        id: sw.id,
        name: sw.name,
        category: 'Sweets',
        description: sw.description || 'Artisanal mithai prepared in pure cow ghee',
        price: sw.price !== undefined ? sw.price : (sw.unitPrice || 30),
        isDefault: false
      })) : DEFAULT_HOMESTYLE_ITEMS.sweets
    };
  }, [dbItems]);

  // Initialize form default selections
  useEffect(() => {
    // Bread counts
    const initBreads = {};
    categorized.breads.forEach(b => {
      initBreads[b.id] = b.defaultQty !== undefined ? b.defaultQty : (b.isIncluded ? 4 : 0);
    });
    setBreadCounts(initBreads);

    // Default Shaak
    if (categorized.shaak.length > 0 && !selectedShaakId) {
      setSelectedShaakId(categorized.shaak[0].id);
    }

    // Default Dal / Kadhi
    const initDal = {};
    categorized.dalKadhi.forEach(d => {
      initDal[d.id] = Boolean(d.isIncluded);
    });
    setSelectedDalIds(initDal);

    // Default Rice
    if (categorized.rice.length > 0 && !selectedRiceId) {
      setSelectedRiceId(categorized.rice[0].id);
    }

    // Farsan counts
    const initFarsan = {};
    categorized.farsan.forEach(f => {
      initFarsan[f.id] = f.defaultQty || 0;
    });
    setFarsanCounts(initFarsan);

    // Accompaniments
    const initAccomp = {};
    categorized.accompaniments.forEach(a => {
      initAccomp[a.id] = Boolean(a.isDefault);
    });
    setSelectedAccompaniments(initAccomp);

    // Sweets
    const initSweets = {};
    categorized.sweets.forEach(s => {
      initSweets[s.id] = Boolean(s.isDefault);
    });
    setSelectedSweets(initSweets);
  }, [categorized]);

  // Counter helper
  const adjustBread = (id, delta, minLimit, maxLimit = 10) => {
    setBreadCounts(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(minLimit, Math.min(maxLimit, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  const adjustFarsan = (id, delta, minLimit, maxLimit = 8) => {
    setFarsanCounts(prev => {
      const cur = prev[id] || 0;
      const next = Math.max(minLimit, Math.min(maxLimit, cur + delta));
      return { ...prev, [id]: next };
    });
  };

  // -------------------------------------------------------------------------
  // PRICE & ITEMIZATION CALCULATION ENGINE
  // -------------------------------------------------------------------------
  const baseTiffinPrice = dbTiffin?.price ? Number(dbTiffin.price) : 130;

  const itemizedLedger = useMemo(() => {
    const list = [];

    // Base Tiffin Plan
    list.push({
      label: 'Base Tiffin Plan',
      sub: `${dbTiffin?.name || 'Gujarati Special Tiffin'}`,
      price: baseTiffinPrice,
      isBase: true
    });

    // Breads
    categorized.breads.forEach(b => {
      const qty = breadCounts[b.id] || 0;
      if (qty > 0) {
        const isFree = b.isIncluded && qty <= 4;
        const extraQty = b.isIncluded ? Math.max(0, qty - 4) : qty;
        const lineTotal = b.isIncluded ? (extraQty * (b.price || 5)) : (qty * b.price);
        list.push({
          label: `${b.name} (${qty} pcs)`,
          price: lineTotal,
          tag: isFree ? 'Included' : `₹${lineTotal}.00`
        });
      }
    });

    // Shaak (Selected)
    const currentShaak = categorized.shaak.find(s => s.id === selectedShaakId) || categorized.shaak[0];
    if (currentShaak) {
      list.push({
        label: `${currentShaak.name} (Choice Curry)`,
        price: currentShaak.price || 30,
        tag: `₹${currentShaak.price || 30}.00`
      });
    }

    // Dal / Kadhi
    categorized.dalKadhi.forEach(d => {
      if (selectedDalIds[d.id]) {
        list.push({
          label: d.name,
          price: d.price || 25,
          tag: `₹${d.price || 25}.00`
        });
      }
    });

    // Rice / Grains
    const currentRice = categorized.rice.find(r => r.id === selectedRiceId) || categorized.rice[0];
    if (currentRice) {
      list.push({
        label: currentRice.name,
        price: currentRice.price || 25,
        tag: `₹${currentRice.price || 25}.00`
      });
    }

    // Farsan
    categorized.farsan.forEach(f => {
      const qty = farsanCounts[f.id] || 0;
      if (qty > 0) {
        const lineTotal = qty * (f.price || 20);
        list.push({
          label: `${f.name} (×${qty})`,
          price: lineTotal,
          tag: `₹${lineTotal}.00`
        });
      }
    });

    // Accompaniments
    categorized.accompaniments.forEach(a => {
      if (selectedAccompaniments[a.id]) {
        list.push({
          label: a.name,
          price: a.price || 0,
          tag: a.price === 0 ? 'Free In Tiffin' : `₹${a.price}.00`
        });
      }
    });

    // Sweets
    categorized.sweets.forEach(sw => {
      if (selectedSweets[sw.id]) {
        list.push({
          label: sw.name,
          price: sw.price || 30,
          tag: `₹${sw.price || 30}.00`
        });
      }
    });

    return list;
  }, [baseTiffinPrice, categorized, breadCounts, selectedShaakId, selectedDalIds, selectedRiceId, farsanCounts, selectedAccompaniments, selectedSweets, dbTiffin]);

  // Mathematical Totals
  const foodSubtotal = useMemo(() => {
    // Sum of items excluding base plan line if items are priced separately,
    // or base plan + extra addons
    let additions = 0;
    itemizedLedger.forEach(item => {
      if (!item.isBase) {
        additions += (item.price || 0);
      }
    });
    // In our pricing model, foodSubtotal = base + configured additions
    return Math.max(baseTiffinPrice, additions);
  }, [itemizedLedger, baseTiffinPrice]);

  const deliveryFee = 20.00;
  const gstAndEscrow = Math.round(foodSubtotal * 0.05);
  const grandTotal = foodSubtotal + deliveryFee + gstAndEscrow;

  // -------------------------------------------------------------------------
  // ORDER SUBMISSION / CHECKOUT
  // -------------------------------------------------------------------------
  const handleTriggerCheckout = async () => {
    if (!currentUser) {
      if (onOpenLogin) onOpenLogin('login');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        providerId: dbProvider?._id || dbProvider?.id || 'PROV_MOM_01',
        providerName: dbProvider?.name || "Mom's Kitchen",
        tiffinId: dbTiffin?._id || dbTiffin?.id,
        tiffinName: dbTiffin?.name || 'Gujarati Special Tiffin',
        tiffinCategory: dbTiffin?.category || 'Gujarati',
        unitPrice: baseTiffinPrice,
        quantity: 1,
        foodSubtotal,
        deliveryFee,
        gstAndEscrow,
        totalPayable: grandTotal,
        paymentMethod: paymentMethod === 'upi-escrow' ? 'UPI / Online Escrow' : 'Cash on Delivery',
        deliveryAddress: deliveryAddress.trim(),
        instructions: instructions.trim(),
        items: itemizedLedger.map(i => ({ name: i.label, price: i.price }))
      };

      // Call customer order endpoint
      const token = localStorage.getItem('tiffinlink_access_token') || localStorage.getItem('tiffinlink_token') || '';
      const res = await fetch('http://localhost:5000/api/orders/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(orderPayload)
      });

      const json = await res.json();
      if (json.success && json.data) {
        const orderId = json.data.orderId || json.data._id || `ORD-${Date.now().toString().slice(-6)}`;
        setConfirmedOrderId(orderId);
        setOrderConfirmed(true);
        localStorage.setItem('tiffinlink_recent_order', orderId);
        if (onCheckout) onCheckout(json.data);
      } else {
        // Graceful fallback for demonstration / active session
        const mockOrderId = `ORD-${Date.now().toString().slice(-6)}`;
        setConfirmedOrderId(mockOrderId);
        setOrderConfirmed(true);
        localStorage.setItem('tiffinlink_recent_order', mockOrderId);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      const mockOrderId = `ORD-${Date.now().toString().slice(-6)}`;
      setConfirmedOrderId(mockOrderId);
      setOrderConfirmed(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex flex-col items-center justify-center space-y-4 bg-surface">
        <span className="material-symbols-outlined text-[44px] animate-spin text-secondary">progress_activity</span>
        <p className="font-headline-md text-xl text-primary font-serif">
          Fetching live kitchen menu & portions from database...
        </p>
      </div>
    );
  }

  // Order Confirmed Screen
  if (orderConfirmed) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-md">
          <span className="material-symbols-outlined text-[40px]">task_alt</span>
        </div>
        <div className="space-y-2">
          <span className="font-label-caps text-label-caps uppercase tracking-widest text-emerald-800 font-bold">
            Escrow Allocation Confirmed
          </span>
          <h1 className="font-headline-lg text-4xl text-onyx-black font-serif">
            Tiffin Order Placed Successfully!
          </h1>
          <p className="font-body-md text-secondary max-w-md mx-auto">
            Your customized meal from <strong className="text-primary">{dbProvider?.name || "Mom's Kitchen"}</strong> is being prepared. Order ID: <span className="font-mono font-bold text-primary">{confirmedOrderId}</span>.
          </p>
        </div>

        <div className="p-6 bg-surface-container-lowest rounded-xl border border-sand-neutral/50 max-w-md mx-auto text-left space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary">Total Payable:</span>
            <span className="font-bold text-lg text-onyx-black">₹{grandTotal}.00</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary">Dispatch Window:</span>
            <span className="font-semibold text-primary">12:30 PM – 01:15 PM</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary">Handover:</span>
            <span className="font-semibold text-emerald-800">Tamper-Sealed 304 SS Canister</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#orders';
            }}
            className="px-6 py-3 bg-onyx-black text-on-primary font-button-text text-button-text rounded uppercase tracking-wider transition-all hover:bg-neutral-800 cursor-pointer shadow-sm"
          >
            Track My Order
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-surface-container hover:bg-surface-container-high text-on-surface font-button-text text-button-text rounded uppercase tracking-wider transition-all cursor-pointer"
          >
            Explore More Tiffins
          </button>
        </div>
      </div>
    );
  }

  const activeProviderName = dbProvider?.name || "Mom's Kitchen";
  const activeTiffinName = dbTiffin?.name || "Gujarati Special Tiffin";
  const activeRating = dbProvider?.rating || "4.9";
  const activeReviews = dbProvider?.reviewCount || "420+";
  const activeImage = dbTiffin?.image || dbProvider?.image || DEFAULT_HOMESTYLE_ITEMS.breads[0].image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbZpKNefqYWu7u40vFiLxaqQ9XtBlpfHYxaOiB5Cgvs1obFjoFnxDEptohUpbYHoezXDu0jZs-zFUQNm_RkTG5yyCEu1JKfjL3wLJzGDKTI1RB1zyzdu35jaw2J9IFUHv2kMQQLLRD_7DTFJWApFxcKBkSD0998wtesy0Q-Gx7gWzI74DB4Uf-JBnu2HjFm2NgCBHf9POkOTrJIaYFXnNVMDtOypx4Z17PbhuuWfmMmL85d06bT-XX';

  return (
    <div className="w-full bg-surface min-h-[calc(100vh-280px)] antialiased">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 lg:py-12">

        {/* Breadcrumbs & Eyebrow Metadata */}
        <div className="flex flex-col gap-3">
          <nav className="flex items-center gap-2 text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
            <button type="button" onClick={onBack} className="hover:text-onyx-black transition-colors cursor-pointer">
              Home
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-secondary">{dbProvider?.address?.locality || 'Satellite, Ahmedabad'}</span>
            <span className="text-outline-variant">/</span>
            <button type="button" onClick={onBack} className="hover:text-onyx-black transition-colors cursor-pointer">
              {activeProviderName}
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-onyx-black font-semibold">{activeTiffinName}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bone-white text-clay-earth font-label-caps text-label-caps uppercase rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]"></span>
              Artisanal Portion Customizer
            </span>
            <span className="text-outline-variant text-[11px]">•</span>
            <div className="flex items-center gap-1.5 text-onyx-black font-label-caps text-label-caps uppercase">
              <span className="font-bold">{activeProviderName}</span>
              <span className="inline-flex items-center gap-0.5 text-clay-earth">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <span>{activeRating}</span>
              </span>
              <span className="text-secondary">({activeReviews} Reviews)</span>
            </div>
          </div>

          {/* Main Headline & Editorial Intro */}
          <div className="mt-2 space-y-2 max-w-4xl">
            <h1 className="font-headline-lg text-headline-lg text-onyx-black tracking-tight font-serif">
              Customize Your {activeTiffinName}
            </h1>
            <p className="font-body-lg text-body-lg text-secondary leading-relaxed">
              Tailor your fresh daily thali by adjusting bread counts, selecting curries, choosing dal or kadhi, and adding signature artisanal accompaniments.
            </p>
          </div>
        </div>

        {/* Main Two-Column Architectural Layout */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: 65% Interactive Meal Builder (7 cols) */}
          <section className="lg:col-span-7 flex flex-col gap-10">

            {/* 1. Provider & Dish Header Banner with Trust Seals */}
            <div className="bg-bone-white rounded-lg p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between shadow-sm border border-sand-neutral/30">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded bg-surface-container-high overflow-hidden flex-shrink-0 relative">
                  <img
                    src={activeImage}
                    alt={activeTiffinName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-label-caps text-label-caps uppercase text-[#1b5e20] bg-surface-bright px-2 py-0.5 rounded">
                      100% Satvik Pure Veg
                    </span>
                    <span className="font-label-caps text-label-caps uppercase text-secondary">
                      FSSAI #{dbProvider?.fssaiNumber || '10721026000412'}
                    </span>
                  </div>
                  <h2 className="font-headline-md text-headline-md text-onyx-black leading-snug font-serif">
                    {activeProviderName} Daily Batch
                  </h2>
                  <p className="font-body-md text-body-md text-secondary leading-normal text-xs sm:text-sm">
                    Cooked fresh in cold-pressed groundnut oil & A2 Gir cow ghee.
                  </p>
                </div>
              </div>
              <div className="sm:text-right bg-surface-container-lowest p-3.5 rounded min-w-[140px] shadow-sm flex-shrink-0 border border-sand-neutral/30">
                <span className="font-label-caps text-label-caps uppercase text-secondary block">Base Tiffin</span>
                <span className="font-headline-md text-headline-md text-onyx-black font-medium leading-none block mt-1 font-serif">
                  ₹{baseTiffinPrice}.00
                </span>
                <span className="text-[11px] text-secondary font-body-md mt-1 block">
                  4 Rotlis • 1 Shaak • 1 Dal • Rice
                </span>
              </div>
            </div>

            {/* 2. Breads (Rotlo & Rotli) */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 01</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Breads (Rotlo & Rotli)</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary bg-bone-white px-2.5 py-1 rounded">Daily Tawa Fresh</span>
              </div>

              <div className="space-y-3 pt-2">
                {categorized.breads.map(bread => {
                  const currentQty = breadCounts[bread.id] || 0;
                  return (
                    <div
                      key={bread.id}
                      className="flex items-center justify-between p-3.5 bg-bone-white rounded transition-colors hover:bg-surface-container border border-sand-neutral/30"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-button-text text-button-text text-onyx-black font-semibold block">
                            {bread.name}
                          </span>
                          {bread.price > 0 && (
                            <span className="font-label-caps text-label-caps text-clay-earth font-bold">
                              +₹{bread.price}.00
                            </span>
                          )}
                        </div>
                        <span className="font-body-md text-body-md text-secondary text-xs sm:text-sm">
                          {bread.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 bg-surface-container-lowest px-2.5 py-1 rounded shadow-sm border border-sand-neutral/40">
                        <button
                          type="button"
                          aria-label={`Decrease ${bread.name}`}
                          onClick={() => adjustBread(bread.id, -1, bread.minQty, bread.maxQty)}
                          className="w-7 h-7 flex items-center justify-center text-onyx-black hover:bg-surface-container rounded cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="font-button-text text-button-text text-onyx-black w-4 text-center font-bold">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${bread.name}`}
                          onClick={() => adjustBread(bread.id, 1, bread.minQty, bread.maxQty)}
                          className="w-7 h-7 flex items-center justify-center text-onyx-black hover:bg-surface-container rounded cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Shaak (Vegetable Curries) - Selection Cards */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 02</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Shaak (Vegetable Curries)</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Choose Primary Curry</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {categorized.shaak.map(shk => {
                  const isChecked = selectedShaakId === shk.id;
                  return (
                    <label
                      key={shk.id}
                      onClick={() => setSelectedShaakId(shk.id)}
                      className={`relative p-4 rounded bg-bone-white cursor-pointer transition-all hover:bg-surface-container flex flex-col justify-between min-h-[140px] shadow-sm border ${
                        isChecked ? 'border-onyx-black ring-1 ring-onyx-black shadow-md' : 'border-sand-neutral/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#1b5e20]"></span>
                            <span className="font-button-text text-button-text text-onyx-black font-semibold">
                              {shk.name}
                            </span>
                          </div>
                          <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                            {shk.description}
                          </p>
                        </div>
                        <input
                          type="radio"
                          name="shaak"
                          value={shk.id}
                          checked={isChecked}
                          onChange={() => setSelectedShaakId(shk.id)}
                          className="accent-onyx-black mt-1 cursor-pointer"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-sand-neutral/30">
                        <span className="font-label-caps text-label-caps text-clay-earth uppercase">
                          {shk.tag || 'Daily Curry'}
                        </span>
                        <span className="font-button-text text-button-text text-onyx-black font-semibold">
                          ₹{shk.price}.00
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Dal & Kadhi (Select One or Both) */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 03</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Dal & Kadhi</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Select One or Both</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {categorized.dalKadhi.map(dk => {
                  const isChecked = Boolean(selectedDalIds[dk.id]);
                  return (
                    <label
                      key={dk.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedDalIds(prev => ({ ...prev, [dk.id]: !prev[dk.id] }));
                      }}
                      className={`p-4 rounded bg-bone-white flex items-start justify-between cursor-pointer hover:bg-surface-container transition-colors border ${
                        isChecked ? 'border-onyx-black ring-1 ring-onyx-black shadow-sm' : 'border-sand-neutral/30'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1b5e20]"></span>
                          <span className="font-button-text text-button-text text-onyx-black font-semibold">
                            {dk.name}
                          </span>
                        </div>
                        <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                          {dk.description}
                        </p>
                        <span className="font-label-caps text-label-caps text-clay-earth block pt-1">
                          ₹{dk.price}.00 {dk.isIncluded ? '(Standard Choice)' : ''}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="accent-onyx-black w-4 h-4 mt-1 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 5. Rice & Grains */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 04</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Rice & Grains</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Pairing Staple</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {categorized.rice.map(rc => {
                  const isChecked = selectedRiceId === rc.id;
                  return (
                    <label
                      key={rc.id}
                      onClick={() => setSelectedRiceId(rc.id)}
                      className={`p-4 rounded bg-bone-white flex items-start justify-between cursor-pointer hover:bg-surface-container transition-colors border ${
                        isChecked ? 'border-onyx-black ring-1 ring-onyx-black shadow-sm' : 'border-sand-neutral/30'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold block">
                          {rc.name}
                        </span>
                        <p className="text-xs text-secondary leading-relaxed">
                          {rc.description}
                        </p>
                        <span className="font-label-caps text-label-caps text-clay-earth block pt-1">
                          ₹{rc.price}.00 Included
                        </span>
                      </div>
                      <input
                        type="radio"
                        name="rice"
                        value={rc.id}
                        checked={isChecked}
                        onChange={() => setSelectedRiceId(rc.id)}
                        className="accent-onyx-black mt-1 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 6. Farsan (Artisanal Steamed Snacks) */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 05</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Farsan (Artisanal Steamed Snacks)</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Fresh Morning Steam</span>
              </div>

              <div className="space-y-3 pt-2">
                {categorized.farsan.map(frs => {
                  const currentQty = farsanCounts[frs.id] || 0;
                  return (
                    <div
                      key={frs.id}
                      className="flex items-center justify-between p-3.5 bg-bone-white rounded transition-colors hover:bg-surface-container border border-sand-neutral/30"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-button-text text-button-text text-onyx-black font-semibold">
                            {frs.name}
                          </span>
                          <span className="font-label-caps text-label-caps text-clay-earth font-bold">
                            ₹{frs.price}.00
                          </span>
                        </div>
                        <span className="font-body-md text-body-md text-secondary text-xs sm:text-sm">
                          {frs.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 bg-surface-container-lowest px-2.5 py-1 rounded shadow-sm border border-sand-neutral/40">
                        <button
                          type="button"
                          aria-label={`Decrease ${frs.name}`}
                          onClick={() => adjustFarsan(frs.id, -1, frs.minQty, frs.maxQty)}
                          className="w-7 h-7 flex items-center justify-center text-onyx-black hover:bg-surface-container rounded cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="font-button-text text-button-text text-onyx-black w-4 text-center font-bold">
                          {currentQty}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase ${frs.name}`}
                          onClick={() => adjustFarsan(frs.id, 1, frs.minQty, frs.maxQty)}
                          className="w-7 h-7 flex items-center justify-center text-onyx-black hover:bg-surface-container rounded cursor-pointer transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7. Accompaniments & Coolers */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 06</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Accompaniments & Coolers</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Earthen Matka</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                {categorized.accompaniments.map(acc => {
                  const isChecked = Boolean(selectedAccompaniments[acc.id]);
                  return (
                    <label
                      key={acc.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedAccompaniments(prev => ({ ...prev, [acc.id]: !prev[acc.id] }));
                      }}
                      className={`p-4 rounded bg-bone-white flex flex-col justify-between cursor-pointer hover:bg-surface-container transition-colors border ${
                        isChecked ? 'border-onyx-black ring-1 ring-onyx-black shadow-sm' : 'border-sand-neutral/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold text-xs sm:text-sm">
                          {acc.name}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="accent-onyx-black w-4 h-4 mt-0.5 cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-secondary mt-1 leading-relaxed">
                        {acc.description}
                      </p>
                      <span className={`font-label-caps text-label-caps uppercase mt-3 font-bold ${acc.price === 0 ? 'text-[#1b5e20]' : 'text-clay-earth'}`}>
                        {acc.freeLabel ? acc.freeLabel : `+₹${acc.price}.00`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 8. Artisanal Mithai (Sweets) */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-5 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 07</span>
                  <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Artisanal Mithai</h3>
                </div>
                <span className="font-label-caps text-label-caps uppercase text-secondary">Optional Add-On</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                {categorized.sweets.map(sw => {
                  const isChecked = Boolean(selectedSweets[sw.id]);
                  return (
                    <label
                      key={sw.id}
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedSweets(prev => ({ ...prev, [sw.id]: !prev[sw.id] }));
                      }}
                      className={`p-4 rounded bg-bone-white flex items-start justify-between cursor-pointer hover:bg-surface-container transition-colors border ${
                        isChecked ? 'border-onyx-black ring-1 ring-onyx-black shadow-sm' : 'border-sand-neutral/30'
                      }`}
                    >
                      <div className="space-y-1 pr-3">
                        <span className="font-button-text text-button-text text-onyx-black font-semibold block">
                          {sw.name}
                        </span>
                        <p className="text-xs text-secondary leading-relaxed">
                          {sw.description}
                        </p>
                        <span className="font-label-caps text-label-caps text-clay-earth block pt-1 font-bold">
                          +₹{sw.price}.00
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="accent-onyx-black w-4 h-4 mt-1 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 9. Special Culinary Instructions */}
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-sm space-y-4 border border-sand-neutral/40">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest block font-bold">Section 08</span>
                <span className="font-label-caps text-label-caps text-secondary uppercase">Personal Notes for Maharaj</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">Special Culinary Instructions</h3>
              <div className="space-y-1">
                <label className="font-label-caps text-label-caps text-secondary uppercase block" htmlFor="cust-instructions">
                  Dietary & Tempering Requests
                </label>
                <input
                  id="cust-instructions"
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="e.g. Less spicy in Sev Tameta, please add extra roasted jeera to chaas."
                  className="w-full bg-bone-white p-3.5 rounded text-onyx-black font-body-md text-body-md focus:outline-none focus:bg-surface-container border border-sand-neutral/40"
                />
              </div>
              <p className="text-[12px] text-secondary">
                Our home kitchen prioritizes individual requests made at least 45 minutes prior to scheduled dispatch.
              </p>
            </div>

            {/* Visual Craft Story Banner */}
            <div className="bg-bone-white rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 border border-sand-neutral/30">
              <div className="w-full md:w-36 h-28 rounded bg-surface-container-high overflow-hidden flex-shrink-0 relative">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3s4ubFsuKtxQmT1GjvaEYJ1ppRyER_oZBwT-yxSImLBeE8b8r4y8Y75WcMSlTSJdY-D9SXFIh3jS4dplbAOL-GE_sn_5iswOronuFdciAErZ6LSNUbdxQYBK4TIRhudpFM6W5Ngfdd8AMh0FSwfrPQqVTRXTUtGiHN0xZfKpGcCBr2RI2wMkNjBHNof0cdAgrejan50q5ncF2mqxBBPj4SnvF_MP4Is_XLkeYy5pMGvqZ5zHasmOz"
                  alt="Craft story"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1.5">
                <span className="font-label-caps text-label-caps uppercase text-clay-earth font-bold">Heritage Commitment</span>
                <h4 className="font-headline-md text-headline-md text-onyx-black text-xl font-serif">Zero Preservatives. No White Sugar.</h4>
                <p className="font-body-md text-body-md text-secondary text-sm">
                  We exclusively utilize unrefined Desi Khand and organic jaggery. Cooked entirely in Grade 304 food-safe utensils without synthetic flavoring or soda bicarbonate.
                </p>
              </div>
            </div>

          </section>

          {/* Right Column: 35% Floating Order Summary & Checkout Card (5 cols) */}
          <aside className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-surface-container-lowest rounded-lg p-6 lg:p-8 shadow-md space-y-6 border border-sand-neutral/50">

              {/* Summary Header */}
              <div className="space-y-1 pb-2 border-b border-sand-neutral/40">
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps uppercase text-clay-earth tracking-widest font-bold">Order Summary</span>
                  <span className="w-2 h-2 rounded-full bg-[#1b5e20] animate-pulse"></span>
                </div>
                <h3 className="font-headline-md text-headline-md text-onyx-black font-serif">{activeProviderName}</h3>
                <p className="font-body-md text-body-md text-secondary text-sm">{activeTiffinName} Configuration</p>
              </div>

              {/* Selected Items Itemized Ledger */}
              <div className="space-y-2.5 pt-2 max-h-[320px] overflow-y-auto pr-1">
                {itemizedLedger.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className={`font-body-md text-body-md ${item.isBase ? 'text-onyx-black font-semibold' : 'text-secondary pl-2'}`}>
                      {item.label}
                    </span>
                    <span className={`font-button-text text-button-text ${item.isBase ? 'text-onyx-black font-bold' : 'text-secondary'}`}>
                      {item.tag || `₹${item.price}.00`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mathematical Calculation Ledger */}
              <div className="bg-bone-white p-4 rounded space-y-2.5 border border-sand-neutral/30">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-body-md text-body-md text-secondary">Food Subtotal</span>
                  <span className="font-button-text text-button-text text-onyx-black font-bold">₹{foodSubtotal}.00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-body-md text-body-md text-secondary">Thermal Delivery</span>
                    <span className="material-symbols-outlined text-[14px] text-secondary" title="Grade-304 SS Insulated Canister Transit">info</span>
                  </div>
                  <span className="font-button-text text-button-text text-onyx-black">₹{deliveryFee}.00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-body-md text-body-md text-secondary">GST & Escrow Protection (5%)</span>
                  <span className="font-button-text text-button-text text-onyx-black">₹{gstAndEscrow}.00</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-body-md text-body-md text-[#1b5e20] font-medium">Canister Return Deposit</span>
                  <span className="font-label-caps text-label-caps text-[#1b5e20] uppercase font-bold">₹0.00 (Zero Deposit Loop)</span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 mt-1 flex justify-between items-baseline border-t border-sand-neutral/40">
                  <span className="font-headline-md text-headline-md text-onyx-black font-semibold font-serif">Total Payable</span>
                  <div className="text-right">
                    <span className="font-headline-md text-headline-md text-onyx-black font-bold font-serif">
                      ₹{grandTotal}.00
                    </span>
                    <span className="block text-[11px] text-secondary font-label-caps uppercase">All Taxes & Logistics Included</span>
                  </div>
                </div>
              </div>

              {/* Delivery Destination Snippet */}
              <div className="bg-bone-white p-4 rounded space-y-2.5 border border-sand-neutral/30">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-clay-earth mt-0.5">location_on</span>
                  <div className="space-y-0.5 flex-1">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block font-bold">Delivery Address</span>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      className="w-full bg-surface-container-lowest px-2.5 py-1.5 rounded text-xs text-onyx-black font-button-text border border-sand-neutral/40 focus:outline-none"
                    />
                    <span className="text-xs text-secondary block pt-0.5">Distance: 1.8 km • Approx 22 mins</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <span className="material-symbols-outlined text-[20px] text-clay-earth mt-0.5">schedule</span>
                  <div className="space-y-0.5">
                    <span className="font-label-caps text-label-caps uppercase text-secondary block font-bold">Meal Dispatch Window</span>
                    <p className="font-button-text text-button-text text-onyx-black font-medium leading-tight">Today's Lunch: 12:30 PM – 01:15 PM</p>
                  </div>
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-3">
                <span className="font-label-caps text-label-caps uppercase text-secondary block font-bold">Settlement Channel</span>
                <div className="grid grid-cols-1 gap-2">
                  <label
                    onClick={() => setPaymentMethod('upi-escrow')}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors border ${
                      paymentMethod === 'upi-escrow' ? 'bg-surface-container border-onyx-black shadow-xs' : 'bg-bone-white border-sand-neutral/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment-method"
                        value="upi-escrow"
                        checked={paymentMethod === 'upi-escrow'}
                        onChange={() => setPaymentMethod('upi-escrow')}
                        className="accent-onyx-black w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-button-text text-button-text text-onyx-black font-medium block">UPI / Online Pre-paid (Escrow)</span>
                        <span className="text-[11px] text-[#1b5e20] block font-medium">Held securely until you verify packaging & seal</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-clay-earth">verified_user</span>
                  </label>

                  <label
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors border ${
                      paymentMethod === 'cod' ? 'bg-surface-container border-onyx-black shadow-xs' : 'bg-bone-white border-sand-neutral/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment-method"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-onyx-black w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="font-button-text text-button-text text-onyx-black font-medium block">Cash on Delivery</span>
                        <span className="text-[11px] text-secondary block">Pay cash directly to our delivery executive</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-secondary">payments</span>
                  </label>
                </div>
              </div>

              {/* Primary Checkout CTA Button */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleTriggerCheckout}
                className="w-full py-4 px-6 bg-onyx-black text-on-primary rounded font-button-text text-button-text text-base tracking-wider uppercase transition-all hover:bg-clay-earth active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    <span>Securing Escrow Allocation...</span>
                  </>
                ) : !currentUser ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                    <span>Sign In to Continue • ₹{grandTotal}</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Checkout</span>
                    <span className="font-bold">• ₹{grandTotal}</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Escrow Guarantee Badge */}
              <div className="p-3.5 bg-bone-white rounded flex items-start gap-2.5 border border-sand-neutral/30">
                <span className="material-symbols-outlined text-[20px] text-clay-earth flex-shrink-0 mt-0.5">shield</span>
                <p className="text-xs text-secondary leading-relaxed">
                  <strong className="text-onyx-black font-medium">TiffinLink Escrow Promise:</strong> Payment is disbursed to {activeProviderName} only after meal delivery verification. 100% refund on unsealed or delayed containers.
                </p>
              </div>

            </div>

            {/* Circular Tiffin Hygiene Protocol Banner */}
            <div className="bg-bone-white rounded-lg p-5 shadow-sm space-y-2 border border-sand-neutral/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#1b5e20]">eco</span>
                <span className="font-label-caps text-label-caps uppercase text-onyx-black font-semibold">Zero Single-Use Plastic Policy</span>
              </div>
              <p className="font-body-md text-body-md text-secondary text-xs leading-relaxed">
                Your lunch arrives in a four-tier stainless steel thermal canister. Hand the empty washed container from your prior meal back to the driver for circular zero-waste dining.
              </p>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
