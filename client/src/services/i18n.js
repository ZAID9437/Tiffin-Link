import { useState, useEffect } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en_IN', name: 'English (India)', native: 'English', desc: 'Standard kitchen & delivery dispatch terminology' },
  { code: 'gu_IN', name: 'ગુજરાતી (Gujarati)', native: 'ગુજરાતી', desc: 'સ્થાનિક રસોઈ, દૈનિક થાળી અને ડિલિવરી સંચાલન' },
  { code: 'hi_IN', name: 'हिन्दी (Hindi)', native: 'हिन्दी', desc: 'दैनिक टिफिन, रसोई तैयारी एवं आर्डर प्रबंधन' }
];

export const translations = {
  en_IN: {
    // Sidebar Navigation
    dashboard: 'Dashboard',
    live_requests: 'Live Requests',
    orders: 'Orders',
    all_orders: 'All Orders',
    new_orders: 'New Orders',
    preparing: 'Preparing',
    ready: 'Ready',
    delivery: 'Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled',
    my_tiffins: 'My Tiffins',
    all_tiffins: 'All Tiffins',
    tiffin_categories: 'Tiffin Categories',
    add_tiffin: 'Add Tiffin',
    tiffin_items: 'Tiffin Items',
    availability: 'Availability',
    delivery_management: 'Delivery Management',
    earnings_payments: 'Earnings & Payments',
    earnings_overview: 'Earnings Overview',
    transactions: 'Transactions',
    incentives: 'Incentives',
    wallet: 'Wallet',
    bank_payout: 'Bank & Payout',
    performance: 'Performance',
    ratings_reviews: 'Ratings & Reviews',
    notifications: 'Notifications',
    help_support: 'Help & Support',
    settings: 'Settings',
    account: 'Account',
    privacy_security: 'Privacy & Security',
    app_preferences: 'App Preferences',

    // Status & Actions
    online: 'ONLINE',
    offline: 'OFFLINE',
    go_offline: 'GO OFFLINE',
    go_online: 'GO ONLINE',
    accepting_orders: 'Accepting customer orders in real-time',
    kitchen_paused: 'Kitchen paused • Not accepting orders',
    log_out: 'Log Out',
    home_kitchen_provider: 'Home Kitchen Provider',
    partner: 'Partner',
    search_placeholder: 'Search orders, tiffins, customers... (Order ID, Name, Phone)',

    // Settings Headers
    account_settings: 'Account Settings',
    notification_preferences: 'Notification Preferences',
    app_preferences_title: 'App Preferences',
    privacy_security_title: 'Privacy & Security',
    language_regional: 'Language & Regional Localization',
    appearance_theme: 'Appearance & Theme Settings',
    save_preferences: 'Save App Preferences',
    save_account: 'Save Account',
    discard: 'Discard',
    active_now: 'ACTIVE',
    primary: 'Primary',
    regional: 'Regional',

    // Descriptions
    account_settings_desc: 'Manage your provider profile, business credentials, and authenticated contact details.',
    app_preferences_desc: 'Customize your kitchen dashboard interface density, language, live dispatch updates, and map rendering for optimal culinary throughput.'
  },

  gu_IN: {
    // Sidebar Navigation
    dashboard: 'ડેશબોર્ડ',
    live_requests: 'લાઇવ વિનંતીઓ',
    orders: 'ઓર્ડર્સ',
    all_orders: 'બધા ઓર્ડર્સ',
    new_orders: 'નવા ઓર્ડર્સ',
    preparing: 'બનાવટ હેઠળ (રસોઈ)',
    ready: 'તૈયાર છે',
    delivery: 'ડિલિવરી',
    completed: 'પૂર્ણ થયેલ',
    cancelled: 'રદ થયેલ',
    my_tiffins: 'મારા ટિફિન',
    all_tiffins: 'બધા ટિફિન',
    tiffin_categories: 'ટિફિન કેટેગરીઝ',
    add_tiffin: 'નવું ટિફિન ઉમેરો',
    tiffin_items: 'વાનગીઓ / વસ્તુઓ',
    availability: 'ઉપલબ્ધતા',
    delivery_management: 'ડિલિવરી સંચાલન',
    earnings_payments: 'કમાણી અને ચૂકવણી',
    earnings_overview: 'કમાણી વિહંગાવલોકન',
    transactions: 'વ્યવહારો',
    incentives: 'પ્રોત્સાહન (બોનસ)',
    wallet: 'વોલેટ',
    bank_payout: 'બેંક અને પેઆઉટ',
    performance: 'રસોઈ પ્રદર્શન',
    ratings_reviews: 'રેટિંગ અને સમીક્ષાઓ',
    notifications: 'સૂચનાઓ',
    help_support: 'મદદ અને સપોર્ટ',
    settings: 'સેટિંગ્સ',
    account: 'પ્રોફાઇલ અને ખાતું',
    privacy_security: 'ગોપનીયતા અને સુરક્ષા',
    app_preferences: 'એપ પસંદગીઓ',

    // Status & Actions
    online: 'ઓનલાઇન',
    offline: 'ઓફલાઇન',
    go_offline: 'ઓફલાઇન થાઓ',
    go_online: 'ઓનલાઇન થાઓ',
    accepting_orders: 'વાસ્તવિક સમયમાં ગ્રાહક ઓર્ડર સ્વીકારી રહ્યા છીએ',
    kitchen_paused: 'રસોડું સ્થગિત • નવા ઓર્ડર બંધ છે',
    log_out: 'લૉગ આઉટ',
    home_kitchen_provider: 'ઘરેલું રસોઈ પ્રદાતા',
    partner: 'ભાગીદાર',
    search_placeholder: 'ઓર્ડર, ટિફિન, ગ્રાહક શોધો... (ઓર્ડર ID, નામ, ફોન)',

    // Settings Headers
    account_settings: 'ખાતા સેટિંગ્સ',
    notification_preferences: 'સૂચના પસંદગીઓ',
    app_preferences_title: 'એપ પસંદગીઓ',
    privacy_security_title: 'ગોપનીયતા અને સુરક્ષા નિયમો',
    language_regional: 'ભાષા અને પ્રાદેશિક સ્થાનિકીકરણ',
    appearance_theme: 'દેખાવ અને થીમ સેટિંગ્સ',
    save_preferences: 'પસંદગીઓ સાચવો',
    save_account: 'પ્રોફાઇલ સાચવો',
    discard: 'રદ કરો',
    active_now: 'સક્રિય',
    primary: 'પ્રાથમિક',
    regional: 'પ્રાદેશિક',

    // Descriptions
    account_settings_desc: 'તમારી રસોઈ પ્રોફાઇલ, વ્યાપારી ઓળખપત્રો અને ચકાસાયેલ સંપર્ક વિગતોનું સંચાલન કરો.',
    app_preferences_desc: 'શ્રેષ્ઠ રસોઈ કાર્યક્ષમતા માટે ઇન્ટરફેસ ઘનતા, ભાષા અને નકશા સુવિધાઓને કસ્ટમાઇઝ કરો.'
  },

  hi_IN: {
    // Sidebar Navigation
    dashboard: 'डैशबोर्ड',
    live_requests: 'लाइव अनुरोध',
    orders: 'ऑर्डर',
    all_orders: 'सभी ऑर्डर',
    new_orders: 'नए ऑर्डर',
    preparing: 'तैयारी जारी है',
    ready: 'तैयार है',
    delivery: 'डिलीवरी',
    completed: 'पूर्ण',
    cancelled: 'रद्द',
    my_tiffins: 'मेरे टिफिन',
    all_tiffins: 'सभी टिफिन',
    tiffin_categories: 'टिफिन श्रेणियां',
    add_tiffin: 'टिफिन जोड़ें',
    tiffin_items: 'टिफिन व्यंजन',
    availability: 'उपलब्धता',
    delivery_management: 'डिलीवरी प्रबंधन',
    earnings_payments: 'कमाई एवं भुगतान',
    earnings_overview: 'कमाई का विवरण',
    transactions: 'लेन-देन',
    incentives: 'प्रोत्साहन (बोनस)',
    wallet: 'वॉलेट',
    bank_payout: 'बैंक एवं भुगतान',
    performance: 'प्रदर्शन',
    ratings_reviews: 'रेटिंग एवं समीक्षाएं',
    notifications: 'सूचनाएं',
    help_support: 'सहायता एवं समर्थन',
    settings: 'सेटिंग्स',
    account: 'खाता (प्रोफाइल)',
    privacy_security: 'गोपनीयता एवं सुरक्षा',
    app_preferences: 'ऐप प्राथमिकताएं',

    // Status & Actions
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    go_offline: 'ऑफलाइन जाएं',
    go_online: 'ऑनलाइन आएं',
    accepting_orders: 'वास्तविक समय में ग्राहक ऑर्डर स्वीकार कर रहे हैं',
    kitchen_paused: 'रसोई रुकी हुई है • ऑर्डर बंद हैं',
    log_out: 'लॉग आउट',
    home_kitchen_provider: 'होम किचन पार्टनर',
    partner: 'पार्टनर',
    search_placeholder: 'ऑर्डर, टिफिन, ग्राहक खोजें... (ऑर्डर ID, नाम, फोन)',

    // Settings Headers
    account_settings: 'खाता सेटिंग्स',
    notification_preferences: 'सूचना प्राथमिकताएं',
    app_preferences_title: 'ऐप प्राथमिकताएं',
    privacy_security_title: 'गोपनीयता एवं सुरक्षा प्रोटोकॉल',
    language_regional: 'भाषा एवं क्षेत्रीय स्थानीयकरण',
    appearance_theme: 'दिखावट एवं थीम सेटिंग्स',
    save_preferences: 'प्राथमिकताएं सहेजें',
    save_account: 'खाता सहेजें',
    discard: 'रद्द करें',
    active_now: 'सक्रिय',
    primary: 'प्राथमिक',
    regional: 'क्षेत्रीय',

    // Descriptions
    account_settings_desc: 'अपनी रसोई प्रोफाइल, व्यावसायिक साख और सत्यापित संपर्क विवरण प्रबंधित करें।',
    app_preferences_desc: 'रसोई संचालन की गति बढ़ाने के लिए इंटरफ़ेस घनत्व, भाषा और मानचित्र सेटिंग्स अनुकूलित करें।'
  }
};

export function getLanguage() {
  if (typeof window === 'undefined') return 'en_IN';
  try {
    const saved = localStorage.getItem('tiffinlink_language');
    if (saved && translations[saved]) return saved;
  } catch (e) {}
  return 'en_IN';
}

export function setLanguage(langCode) {
  if (!translations[langCode]) langCode = 'en_IN';
  try {
    localStorage.setItem('tiffinlink_language', langCode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode === 'gu_IN' ? 'gu' : langCode === 'hi_IN' ? 'hi' : 'en';
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tiffinlink_language_changed', { detail: { lang: langCode } }));
  }
}

export function t(key, fallback = '', lang = null) {
  const currentLang = lang || getLanguage();
  const dict = translations[currentLang] || translations.en_IN;
  if (dict && dict[key]) return dict[key];
  if (translations.en_IN && translations.en_IN[key]) return translations.en_IN[key];
  return fallback || key;
}

export function useTranslation() {
  const [lang, setLangState] = useState(() => getLanguage());

  useEffect(() => {
    const handleLangChange = (e) => {
      const nextLang = e?.detail?.lang || getLanguage();
      setLangState(nextLang);
    };

    window.addEventListener('tiffinlink_language_changed', handleLangChange);
    window.addEventListener('storage', handleLangChange);

    return () => {
      window.removeEventListener('tiffinlink_language_changed', handleLangChange);
      window.removeEventListener('storage', handleLangChange);
    };
  }, []);

  return {
    lang,
    t: (key, fallback = '') => t(key, fallback, lang),
    setLanguage
  };
}
