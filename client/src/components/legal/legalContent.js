// TiffinLink Legal, Policy, Security and Agreement Registry
// Compliant with Indian Information Technology Act, Consumer Protection (E-Commerce) Rules, and FSSAI guidelines

export const LEGAL_DOCUMENTS = {
  'privacy-policy': {
    id: 'privacy-policy',
    title: 'Privacy Policy',
    badge: 'LEGAL NOTICE',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Explains what personal data TiffinLink collects, why we collect it, how driver GPS is handled, data sharing boundaries, and your privacy rights.',
    sections: [
      {
        heading: '1. Introduction & Overview',
        content: `TiffinLink ("we", "our", or "the Platform") operates an artisanal hyperlocal meal discovery, ordering, and dispatch platform connecting diners with verified home chefs and independent delivery partners. We are committed to safeguarding the privacy and personal data of all users across our customer, kitchen provider, and delivery partner networks in compliance with applicable Indian privacy and data protection regulations.`
      },
      {
        heading: '2. Information We Collect',
        content: `We collect information necessary to prepare, route, and deliver your tiffins safely:
• Account Information: Name, verified email address, mobile phone number, and password hash.
• Addresses & Geolocation: Delivery delivery addresses, apartment details, building entry instructions, and precise GPS coordinates during active delivery sessions.
• Kitchen & Partner KYC: For kitchen providers and delivery drivers, government-issued identification (Aadhaar/PAN verification references), FSSAI license/registration numbers, vehicle registration, and bank settlement details.
• Orders & Dining Preferences: Meal selections, spice customization, dietary preferences (e.g., Satvik, Jain, less oil), past order records, and feedback ratings.
• Payment Telemetry: Secure payment transaction identifiers, payment gateway tokens (Razorpay/UPI references). We never store raw credit card numbers or UPI PINs on our servers.
• Technical & Device Data: IP address, device model, operating system, and browser telemetry collected solely to detect fraud and ensure session security.`
      },
      {
        heading: '3. How We Use Your Data',
        content: `Your data is processed strictly for legitimate operational purposes:
• Fulfilling and coordinating meal orders between customers, chefs, and drivers.
• Enabling live, end-to-end GPS delivery tracking during active dispatches.
• Verifying kitchen food compliance and delivery partner credentials.
• Facilitating escrow payments, kitchen disbursements, and driver payouts.
• Preventing fraudulent orders, platform abuse, and unauthorized account access.
• Communicating vital order status updates via WhatsApp, SMS, and in-app notifications.`
      },
      {
        heading: '4. Information Sharing & Third Parties',
        content: `We do not sell your personal information. Information is shared strictly on a need-to-know operational basis:
• With Assigned Delivery Partners: The customer's delivery name, drop-off address, and phone number are shared solely for the duration of the active delivery trip. Once marked delivered, driver access to customer contact details is masked or revoked.
• With Assigned Home Kitchens: Meal preferences, special culinary requests, and customer first name are shared to facilitate hygienic cooking.
• With Payment Gateways & Banking Partners: Required transaction identifiers are processed through RBI-authorized payment processors for secure settlement.
• Legal Obligations: We may disclose data when required by applicable Indian law, court order, or regulatory inquiry.`
      },
      {
        heading: '5. Data Retention & Security Controls',
        content: `We retain order records, invoices, and accounting telemetry for 7 years to satisfy statutory tax and commercial requirements under Indian law. Inactive account details and temporary GPS trace logs are archived or scrubbed after the operational delivery window closes. We employ SSL/TLS encryption in transit, bcrypt salted password hashing, and role-based access control across all database clusters.`
      },
      {
        heading: '6. Your Privacy Rights & Controls',
        content: `You maintain complete sovereignty over your data through your Account Settings:
• Data Access & Portability: Request a complete export of your profile, orders, and addresses in structured JSON format.
• Correction: Update inaccurate profile information or addresses at any time.
• Revocation of Consent: Toggle marketing communications, location tracking, and analytics preferences in your account settings.
• Account Deletion: Request permanent erasure of your account. Records required for regulatory tax compliance or active dispute resolution are safely retained until statutory expiry.`
      },
      {
        heading: '7. Contact Our Grievance & Privacy Officer',
        content: `In accordance with Information Technology Act, 2000 and Rules made thereunder:
Grievance Officer: Legal & Data Protection Desk
TiffinLink Artisanal Dining Technologies Pvt. Ltd.
Email: privacy@tiffinlink.in • grievance@tiffinlink.in
Address: Near Navrangpura Culinary Hub, Ahmedabad, Gujarat 380009`
      }
    ]
  },

  'terms': {
    id: 'terms',
    title: 'Terms and Conditions',
    badge: 'USER AGREEMENT',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'The master agreement governing use of TiffinLink, platform responsibilities, account conduct, meal ordering, intellectual property, and dispute resolution.',
    sections: [
      {
        heading: '1. Platform Intermediary Status',
        content: `TiffinLink is a digital marketplace platform operating as an intermediary under Section 79 of the Information Technology Act, 2000. TiffinLink facilitates culinary discovery, communication, order routing, payment collection, and dispatch coordination between independent diners, certified home kitchens ("Providers"), and independent fleet contractors ("Delivery Partners"). TiffinLink does not itself cook meals or own delivery vehicles.`
      },
      {
        heading: '2. User Accounts & Eligibility',
        content: `Users must be at least 18 years of age to register and place orders. You agree to provide accurate, current, and complete registration information. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities conducted through your account.`
      },
      {
        heading: '3. Meal Ordering & Contract Formation',
        content: `When you place an order, you extend an offer to purchase the tiffin meal from the selected Provider. The contract for meal supply is strictly between you and the Provider. Acceptance occurs when the Provider confirms the order in their kitchen dashboard. TiffinLink acts solely as an authorized payment collection and order dispatch intermediary.`
      },
      {
        heading: '4. Prohibited Activities',
        content: `Users agree not to:
• Place fraudulent, fictitious, or speculative meal orders.
• Harass, intimidate, or abuse home chefs, delivery partners, or support representatives.
• Commercialize or re-sell TiffinLink meals without written corporate approval.
• Exploit coupon codes, referral credits, or platform loopholes.
• Scrape, reverse engineer, or deploy automated bots against our API or website.`
      },
      {
        heading: '5. Limitation of Liability',
        content: `To the maximum extent permitted by applicable law, TiffinLink shall not be liable for indirect, incidental, punitive, or consequential damages arising from meal consumption, delivery transit delays caused by extreme traffic or weather, or provider cancellations. In all events, TiffinLink's cumulative liability shall be limited to the order amount paid for the specific affected transaction.`
      },
      {
        heading: '6. Governing Law & Dispute Resolution',
        content: `These terms shall be governed by and construed in accordance with the laws of India. Any disputes, claims, or controversies arising hereunder shall be subject to the exclusive jurisdiction of the competent courts in Ahmedabad, Gujarat, India.`
      }
    ]
  },

  'cookie-policy': {
    id: 'cookie-policy',
    title: 'Cookie and Storage Policy',
    badge: 'TECHNICAL COMPLIANCE',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Details our usage of essential session tokens, functional preference storage, local analytics, and how you can manage browser cookie preferences.',
    sections: [
      {
        heading: '1. What Are Cookies & Local Storage?',
        content: `Cookies and browser LocalStorage are small data files placed on your device to keep you securely signed in, preserve your active tiffin cart, and remember your culinary preferences between browsing sessions.`
      },
      {
        heading: '2. Cookie Categories Used on TiffinLink',
        content: `We categorize browser storage into distinct types:
• Essential Authentication Tokens (Mandatory): These secure JWT tokens ('tiffinlink_token', 'tiffinlink_user') maintain your authenticated session, role security, and CSRF protection. The platform cannot function without them.
• Functional & Experience Preferences: Retains your chosen dark/light interface theme, spice tolerance preference, saved addresses, and active meal cart.
• Performance & Operational Analytics: Privacy-preserving telemetry that measures page load speeds, network latencies, and server health to prevent platform outages.
• Marketing & Culinary Discovery (Optional): Stores your recent cuisine queries to suggest relevant home kitchens in your immediate neighborhood.`
      },
      {
        heading: '3. Managing Your Cookie Choices',
        content: `You can customize your cookie consent at any time using our Cookie Consent Banner or the Cookie Preferences button in our footer. You may also configure your browser to block third-party cookies; however, disabling essential session tokens will prevent you from logging in or placing tiffin orders.`
      }
    ]
  },

  'cancellation-refund-policy': {
    id: 'cancellation-refund-policy',
    title: 'Cancellation and Refund Policy',
    badge: 'CONSUMER PROTECTION',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Clear guidelines on order cancellations, kitchen acceptance windows, refund eligibility, payment failure reversals, and settlement timelines.',
    sections: [
      {
        heading: '1. Customer Order Cancellation Windows',
        content: `Because our home kitchens cook tiffins fresh on demand using perishable ingredients:
• Before Kitchen Acceptance: You may cancel your order with a 100% immediate full refund before the kitchen provider accepts and begins meal preparation.
• After Kitchen Acceptance & Cooking Commenced: Once the kitchen confirms the order and begins culinary preparation, cancellations cannot be fully refunded as fresh ingredients have been committed.
• After Dispatch: No cancellations are permitted once the delivery partner is en route with your warm meal.`
      },
      {
        heading: '2. Provider Rejection & Platform Cancellations',
        content: `If a home kitchen declines your meal request due to kitchen capacity, unavailability of fresh ingredients, or severe dispatch disruptions:
• You will receive an immediate notification.
• 100% of the transaction amount is instantly unlocked and refunded to your original payment method with zero cancellation fees.`
      },
      {
        heading: '3. Quality Issues & Missing Items',
        content: `If a meal arrives damaged, spilled, incorrect, or significantly deficient in food quality:
• Report the problem via 'My Orders > Report Issue' or contact our support team within 2 hours of delivery with photographic evidence.
• Following verified review, TiffinLink will issue an appropriate partial or full refund or provide meal replacement credits directly to your account.`
      },
      {
        heading: '4. Refund Processing Timelines',
        content: `Refunds are processed through authorized banking channels:
• UPI Payments: Typically credited within 2 to 24 hours.
• Credit / Debit Cards / Net Banking: Credited within 3 to 5 business days, depending on your card issuer's banking clearance cycle.`
      }
    ]
  },

  'delivery-policy': {
    id: 'delivery-policy',
    title: 'Delivery and Dispatch Policy',
    badge: 'LOGISTICS GUIDELINES',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Explains our hyperlocal delivery radius, scheduled meal windows, delivery charges, handover protocols, address changes, and delivery exceptions.',
    sections: [
      {
        heading: '1. Hyperlocal Delivery Radius & Times',
        content: `To ensure home-cooked tiffins arrive piping hot and fresh, deliveries operate within an optimized hyperlocal radius of 3km to 7km from the home kitchen. Typical transit times range from 25 to 45 minutes from culinary packaging to doorstep handover.`
      },
      {
        heading: '2. Scheduled Lunch & Dinner Windows',
        content: `Subscription and pre-ordered tiffins follow standard delivery cycles:
• Lunch Service: 12:00 PM – 2:00 PM
• Dinner Service: 7:30 PM – 9:30 PM
Diners receive real-time driver dispatch tracking and estimated time of arrival (ETA) notifications as the meal is picked up.`
      },
      {
        heading: '3. Handover Protocols & Unreachable Customers',
        content: `Delivery partners will deliver to the address provided:
• The partner will attempt to call the registered customer number upon arrival.
• If the customer is unreachable after 10 minutes of active arrival and repeated attempts, the delivery partner may leave the tiffin at the building reception/doorstep or return the sealed package to avoid food degradation. In such cases, the order is deemed fulfilled.`
      },
      {
        heading: '4. Severe Weather & Force Majeure',
        content: `During heavy monsoons, waterlogging, civic road closures, or severe weather conditions, dispatch windows may be extended to prioritize driver safety. Diners are kept informed via live notifications.`
      }
    ]
  },

  'pricing-commission-policy': {
    id: 'pricing-commission-policy',
    title: 'Pricing, Commission and Payment Policy',
    badge: 'COMMERCIAL TERMS',
    category: 'Core Policies',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Transparent breakdown of meal prices, platform commissions, packaging fees, delivery partner earnings, driver tips, and tax settlements.',
    sections: [
      {
        heading: '1. Transparent Customer Pricing',
        content: `Every checkout bill provides an itemized breakdown:
• Meal Item Price: Set directly by each independent home kitchen.
• Packaging & Bio-Degradable Dabba Fee: Direct cost of eco-friendly, microwave-safe containers.
• Delivery Charge: Distance-based logistical fare paid to delivery partners.
• Platform Facilitation Fee: Minimal charge supporting server uptime, customer support, and order routing.
• Statutory Taxes: GST as mandated by Government of India regulations.`
      },
      {
        heading: '2. Provider Commission Structure',
        content: `Home kitchens retain the vast majority of their food revenue. TiffinLink charges a transparent 10% - 12% marketplace facilitation fee on completed orders to cover credit card gateway fees, order dispute escrow, customer acquisition, and technical operations. Kitchen earnings are settled directly to registered bank accounts on a weekly or daily schedule.`
      },
      {
        heading: '3. Delivery Partner Earnings & 100% Tips',
        content: `Delivery partners earn base distance compensation, peak-hour incentives, and waiting allowances. 100% of customer tips entered through TiffinLink are passed directly to the delivery partner with zero platform deductions.`
      }
    ]
  },

  'food-safety-disclaimer': {
    id: 'food-safety-disclaimer',
    title: 'Food Safety and Allergen Disclaimer',
    badge: 'HEALTH & NUTRITION',
    category: 'Disclaimers',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Important guidelines on kitchen hygiene protocols, allergen communications, dietary labels (Satvik, Jain, Veg), and diner responsibilities.',
    sections: [
      {
        heading: '1. Home Kitchen Standards & FSSAI Compliance',
        content: `TiffinLink requires all participating home chefs to adhere to FSSAI (Food Safety and Standards Authority of India) registration guidelines, maintain clean culinary workstations, practice strict hand hygiene, use potable filtered water, and pack meals in food-grade sealed packaging.`
      },
      {
        heading: '2. Allergen Notice & Cross-Contamination Warning',
        content: `Meals are prepared in authentic artisanal home kitchens that may handle wheat (gluten), peanuts, tree nuts, dairy (milk, ghee, paneer), sesame, mustard, and soy. While our chefs follow great care, home kitchen environments cannot guarantee a 100% allergen-free or sterile facility. Customers with severe, life-threatening food allergies must exercise personal discretion and communicate directly with providers before ordering.`
      },
      {
        heading: '3. Satvik & Jain Meal Preparation',
        content: `Kitchens offering Jain or Satvik meals commit to strictly zero onion, zero garlic, and zero root vegetables for designated dishes, cooked using dedicated utensils and pure vegetarian ingredients.`
      },
      {
        heading: '4. Immediate Consumption Advisory',
        content: `Fresh home-cooked tiffins contain zero artificial preservatives. Meals should be consumed within 2 to 3 hours of delivery or promptly refrigerated at or below 4°C to preserve freshness and nutritional value.`
      }
    ]
  },

  'community-guidelines': {
    id: 'community-guidelines',
    title: 'Reviews and Community Guidelines',
    badge: 'COMMUNITY STANDARDS',
    category: 'Disclaimers',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Standards for honest culinary reviews, respectful communication with chefs and delivery partners, and zero tolerance for harassment or fake ratings.',
    sections: [
      {
        heading: '1. Genuine, Verified Reviews',
        content: `Only diners with confirmed, completed orders may leave ratings and reviews. Reviews must reflect your authentic culinary experience. Fake ratings, competitor sabotage, and paid promotional reviews are strictly prohibited and purged by our automated moderation system.`
      },
      {
        heading: '2. Respectful Communication',
        content: `TiffinLink is built on mutual warmth and respect between diners, passionate home chefs, and hard-working delivery partners. Harassment, profanity, discriminatory remarks, hate speech, or verbal abuse directed at any partner or diner will result in immediate and permanent account termination.`
      },
      {
        heading: '3. Reporting Misconduct',
        content: `If you encounter inappropriate behavior, unhygienic packaging, or safety violations, report it immediately through our 'Report Issue' portal or email community@tiffinlink.in. All reports are investigated confidentially within 24 hours.`
      }
    ]
  },

  'customer-terms': {
    id: 'customer-terms',
    title: 'Customer Terms of Service',
    badge: 'DINER AGREEMENT',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Specific contractual conditions governing diner accounts, daily and subscription meal orders, custom quotes, payments, and dabba deposits.',
    sections: [
      {
        heading: '1. Account Responsibilities',
        content: `As a diner on TiffinLink, you agree to maintain accurate contact information, ensure building access for delivery personnel, and verify that meal selections match your dietary requirements prior to order placement.`
      },
      {
        heading: '2. Subscription Tiffins & Pausing Orders',
        content: `Subscription meal plans allow scheduled recurring delivery. Diners may pause, skip, or modify upcoming tiffin dates via 'My Orders > Subscriptions' prior to the daily culinary cutoff deadline (10:00 PM the prior evening for lunch; 3:00 PM same day for dinner). Skipped meals are automatically credited to extend your billing cycle.`
      },
      {
        heading: '3. Stainless Steel Dabba Deposit Escrow',
        content: `Where eco-friendly reusable stainless steel dabbas are utilized, a modest refundable security deposit is held in escrow. Upon handover of the cleaned dabba to the delivery partner on your subsequent delivery, the deposit is promptly credited back to your wallet or payment method.`
      }
    ]
  },

  'provider-agreement': {
    id: 'provider-agreement',
    title: 'Kitchen Provider Agreement',
    badge: 'PARTNER CONTRACT',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'The commercial agreement for home kitchens, covering onboarding verification, FSSAI compliance, menu accuracy, commissions, payouts, and service standards.',
    sections: [
      {
        heading: '1. Provider Onboarding & Verification',
        content: `Kitchen Providers must submit valid government identification, FSSAI registration/license, and high-resolution kitchen photography. Providers represent and warrant that all meals are prepared in hygienic, safe domestic kitchen premises.`
      },
      {
        heading: '2. Culinary Standards & Menu Integrity',
        content: `Providers must prepare meals matching the ingredients, portions, and dietary classifications (e.g., Jain, Satvik, Veg) displayed on their public menu. Substitution of major ingredients without customer consent is prohibited.`
      },
      {
        heading: '3. Order Acceptance & Packaging SLAs',
        content: `Providers agree to accept or decline meal requests within 5 minutes of receipt. Meals must be freshly packaged in food-grade, leak-proof containers and ready for driver handover at the designated dispatch time to prevent customer waiting.`
      },
      {
        heading: '4. Settlements & Commission Deductions',
        content: `TiffinLink deducts its agreed platform fee (10%-12%) from gross order revenue. Net kitchen earnings are disbursed automatically to the Provider's registered bank account on the agreed weekly or daily settlement schedule.`
      }
    ]
  },

  'delivery-partner-agreement': {
    id: 'delivery-partner-agreement',
    title: 'Delivery Partner Agreement',
    badge: 'FLEET CONTRACT',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Independent contractor agreement governing delivery partners, safety obligations, live GPS telemetry, trip fares, payouts, and professional conduct.',
    sections: [
      {
        heading: '1. Independent Contractor Relationship',
        content: `Delivery Partners operate as independent business contractors and not as employees or agents of TiffinLink. Partners have complete autonomy to choose their active hours, accept or reject delivery offers, and select preferred service zones.`
      },
      {
        heading: '2. Documentation & Vehicle Safety',
        content: `Partners must maintain a valid Indian driving license, active vehicular insurance, and helmet/safety equipment. Vehicles must be kept in safe, roadworthy condition at all times.`
      },
      {
        heading: '3. Real-Time GPS Tracking Consent',
        content: `During an active delivery trip (from order pickup at the kitchen until drop-off completion at the diner's address), the partner's device transmits real-time GPS telemetry to enable live customer tracking and dispatch verification. Location transmission ceases automatically when the partner goes offline.`
      },
      {
        heading: '4. Payouts & Tips',
        content: `Partners receive distance-based trip compensation, waiting allowances, and peak incentives. 100% of customer tips are paid out directly with zero company deductions on the weekly fleet settlement cycle.`
      }
    ]
  },

  'corporate-terms': {
    id: 'corporate-terms',
    title: 'Corporate and Bulk Dining Terms',
    badge: 'B2B CONTRACT',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Governs corporate cafeteria partnerships, employee meal allowance stipends, monthly invoicing, volume discounts, and office delivery coordination.',
    sections: [
      {
        heading: '1. Corporate Master Billing',
        content: `Organizations registered under TiffinLink Corporate may configure employee meal stipends, department budget caps, and centralized GST invoicing payable on net-15 or net-30 terms following credit verification.`
      },
      {
        heading: '2. Bulk Office Deliveries & Cutoffs',
        content: `Bulk orders exceeding 15 meals must be submitted before 9:30 AM for lunch service to allow home kitchens sufficient time to prepare high-volume batches with uncompromising artisanal quality.`
      }
    ]
  },

  'group-hostel-terms': {
    id: 'group-hostel-terms',
    title: 'Hostel and PG Group Ordering Terms',
    badge: 'COMMUNITY AGREEMENT',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Guidelines for student hostels and PG clusters pooling daily tiffin orders to reduce delivery costs and unlock bulk kitchen pricing.',
    sections: [
      {
        heading: '1. Group Order Pools',
        content: `Students residing in hostels or PG accommodations may join a designated hostel pool. When minimum headcount thresholds are met, pooled orders unlock discounted delivery and group pricing.`
      },
      {
        heading: '2. Individual Billing & Central Drop-off',
        content: `Each student pays for their individual meal directly through TiffinLink. Deliveries are batched and handed over to the hostel gate/reception or designated floor coordinator at the scheduled meal window.`
      }
    ]
  },

  'provider-subscription-terms': {
    id: 'provider-subscription-terms',
    title: 'Provider Subscription & Booster Terms',
    badge: 'SUBSCRIPTION TERMS',
    category: 'Role Agreements',
    lastUpdated: 'October 19, 2026',
    effectiveDate: 'November 1, 2026',
    summary: 'Terms governing optional kitchen promotional boosters, premium dashboard analytics, verified kitchen badges, and billing renewal cycles.',
    sections: [
      {
        heading: '1. Optional Premium Features',
        content: `Home kitchens may optionally subscribe to promotional booster tiers (such as Chef Pro) to unlock advanced demand forecasting, priority culinary placement in neighborhood searches, and verified kitchen badges.`
      },
      {
        heading: '2. Billing & Cancellation',
        content: `Subscription tiers are billed on a recurring monthly basis. Providers may cancel their booster subscription at any time through their kitchen dashboard; cancellations take effect at the conclusion of the current prepaid billing period.`
      }
    ]
  }
};
