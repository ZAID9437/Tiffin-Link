import React, { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp, ArrowRight, Shield, RefreshCw, Headphones, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  const handleSelectPlan = (planName) => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.7 },
      colors: planName === 'Business' ? ['#F59E0B', '#334155'] : ['#10B981', '#334155']
    });
  };

  const starterFeatures = [
    "Receive customer requests",
    "Accept orders",
    "Basic profile & menu",
    "Order history",
    "Basic earnings dashboard",
    "Up to 20 orders/month"
  ];

  const proFeatures = [
    "Unlimited orders",
    "Advanced business analytics",
    "AI demand prediction",
    "Customer CRM",
    "QR ordering",
    "Inventory management",
    "Kitchen capacity management",
    "Priority support",
    "Weekly performance reports"
  ];

  const businessFeatures = [
    "Staff management",
    "Multiple kitchen locations",
    "Delivery management",
    "Mini website",
    "Custom branding",
    "Marketing tools",
    "Coupon campaigns",
    "WhatsApp automation",
    "Financial & GST reports",
    "API access (Coming Soon)"
  ];

  const faqs = [
    {
      question: "Is there any setup fee?",
      answer: "No, there are no setup fees or hidden charges. You can sign up and start using the platform for free under our Starter plan."
    },
    {
      question: "Can I cancel or change my plan anytime?",
      answer: "Yes, TiffinLink is a pay-as-you-go service. You can upgrade, downgrade, or cancel your subscription at any time directly from your dashboard."
    },
    {
      question: "Do you charge GST?",
      answer: "Yes, GST is charged at the applicable rates on top of the subscription fees for Pro and Business plans as per Government regulations."
    },
    {
      question: "How is the commission calculated?",
      answer: "For order matching, we charge a flat 10% marketplace commission on the base meal price. This fee covers payment gateway charges and provider support."
    },
    {
      question: "Can I upgrade my plan later?",
      answer: "Absolutely! You can upgrade your plan instantly from your kitchen portal. Your billing cycle will be adjusted pro-rata based on the remaining days of your current cycle."
    },
    {
      question: "Is there any contract or lock-in period?",
      answer: "No. There are no contracts, commitments, or lock-in periods on any of our monthly plans. You can use it as long as you need."
    }
  ];

  return (
    <section id="pricing" className="pricing-section">
      <div className="container">
        {/* Header */}
        <div className="pricing-header">
          <h2 className="pricing-heading">
            Simple, Transparent Pricing <br />
            Built for <span className="text-emerald">Every Tiffin Business</span>
          </h2>
          <p className="pricing-subheading">
            Choose the plan that fits your business and start growing with TiffinLink.
          </p>

          {/* Toggle Switch */}
          <div className="pricing-toggle-wrapper">
            <button 
              className={`toggle-btn ${!isYearly ? 'active' : ''}`}
              onClick={() => setIsYearly(false)}
            >
              Monthly
            </button>
            <button 
              className={`toggle-btn ${isYearly ? 'active' : ''}`}
              onClick={() => setIsYearly(true)}
            >
              Yearly <span className="discount-tag font-semibold">Save 17%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="pricing-cards-grid">
          {/* Card 1: Starter */}
          <div className="pricing-card card-starter">
            <div className="card-top">
              <h3 className="plan-name">Starter</h3>
              <p className="plan-target">Perfect for new home chefs</p>
              <div className="plan-price-block">
                <span className="price-symbol">₹</span>
                <span className="price-amount">0</span>
                <span className="price-period">/month</span>
              </div>
              <p className="price-subtitle">Zero subscription fee</p>
            </div>
            
            <button onClick={() => handleSelectPlan('Starter')} className="btn btn-starter-action">
              Start Free
            </button>

            <ul className="plan-features-list">
              {starterFeatures.map((feat, idx) => (
                <li key={idx}>
                  <Check size={16} className="text-emerald" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Pro (Most Popular) */}
          <div className="pricing-card card-pro popular">
            <span className="popular-badge">MOST POPULAR</span>
            <div className="card-top">
              <h3 className="plan-name">Pro</h3>
              <p className="plan-target">Best for growing tiffin businesses</p>
              <div className="plan-price-block">
                <span className="price-symbol">₹</span>
                <span className="price-amount">{isYearly ? '415' : '499'}</span>
                <span className="price-period">/month</span>
              </div>
              <p className="price-subtitle">{isYearly ? 'Billed annually (₹4,990)' : 'Billed monthly'}</p>
            </div>

            <button onClick={() => handleSelectPlan('Pro')} className="btn btn-primary btn-pro-action">
              Upgrade to Pro
            </button>

            <div className="features-intro">Everything in Starter, plus:</div>
            <ul className="plan-features-list">
              {proFeatures.map((feat, idx) => (
                <li key={idx}>
                  <Check size={16} className="text-emerald" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: Business */}
          <div className="pricing-card card-business">
            <div className="card-top">
              <h3 className="plan-name text-amber">Business</h3>
              <p className="plan-target">Best for large tiffin services</p>
              <div className="plan-price-block">
                <span className="price-symbol">₹</span>
                <span className="price-amount">{isYearly ? '830' : '999'}</span>
                <span className="price-period">/month</span>
              </div>
              <p className="price-subtitle">{isYearly ? 'Billed annually (₹9,990)' : 'Billed monthly'}</p>
            </div>

            <button onClick={() => handleSelectPlan('Business')} className="btn btn-business-action">
              Get Started
            </button>

            <div className="features-intro">Everything in Pro, plus:</div>
            <ul className="plan-features-list">
              {businessFeatures.map((feat, idx) => (
                <li key={idx}>
                  <Check size={16} className="text-amber" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="comparison-table-wrapper">
          <h3 className="comparison-title">Compare Plans</h3>
          <div className="table-responsive">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Features</th>
                  <th>
                    <span className="header-plan">Starter</span>
                    <span className="header-price">₹0/month</span>
                  </th>
                  <th>
                    <span className="header-plan text-emerald">Pro</span>
                    <span className="header-price">₹499/month</span>
                  </th>
                  <th>
                    <span className="header-plan text-amber">Business</span>
                    <span className="header-price">₹999/month</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Receive Customer Requests</td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
                <tr>
                  <td>Unlimited Orders</td>
                  <td><X size={18} className="text-red centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
                <tr>
                  <td>Business Analytics</td>
                  <td><span className="text-badge text-muted">Basic</span></td>
                  <td><span className="text-badge text-emerald">Advanced</span></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
                <tr>
                  <td>Customer CRM</td>
                  <td><X size={18} className="text-red centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
                <tr>
                  <td>Inventory Management</td>
                  <td><X size={18} className="text-red centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
                <tr>
                  <td>QR Ordering</td>
                  <td><X size={18} className="text-red centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                  <td><Check size={18} className="text-emerald centered-icon" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Lower Row: Commission + FAQs */}
        <div className="pricing-lower-row">
          {/* Marketplace Commission Card */}
          <div className="commission-card">
            <h3 className="lower-row-title">Marketplace Commission</h3>
            <p className="lower-row-desc">We keep it simple and transparent.</p>
            
            <div className="commission-flow">
              <div className="flow-step">
                <span className="step-label">Customer Pays</span>
                <span className="step-value">₹120</span>
              </div>
              <div className="flow-arrow">
                <ArrowRight size={16} />
              </div>
              <div className="flow-step highlight">
                <span className="step-label">Platform Commission (10%)</span>
                <span className="step-value text-amber">₹12</span>
              </div>
              <div className="flow-arrow">
                <ArrowRight size={16} />
              </div>
              <div className="flow-step success">
                <span className="step-label">You Receive</span>
                <span className="step-value text-emerald">₹108</span>
              </div>
            </div>
            <p className="commission-subtext">Low commission. Maximum earnings for you.</p>
          </div>

          {/* FAQs Accordion */}
          <div className="faqs-accordion-card">
            <h3 className="lower-row-title">Frequently Asked Questions</h3>
            <div className="faqs-list">
              {faqs.map((faq, index) => (
                <div key={index} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                  <button onClick={() => toggleFaq(index)} className="faq-question-btn">
                    <span>{faq.question}</span>
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Badges */}
        <div className="pricing-badges-footer">
          <div className="badge-item">
            <Shield size={16} className="text-emerald" />
            <span>100% Secure Payments</span>
          </div>
          <span className="badge-separator">•</span>
          <div className="badge-item">
            <RefreshCw size={16} className="text-emerald" />
            <span>Cancel Anytime</span>
          </div>
          <span className="badge-separator">•</span>
          <div className="badge-item">
            <Headphones size={16} className="text-emerald" />
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      <style>{`
        .pricing-section {
          padding: 6.5rem 0;
          background-color: var(--bg-color);
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }
        
        /* Header */
        .pricing-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 4rem;
        }
        .pricing-heading {
          font-size: 2.75rem;
          line-height: 1.2;
          color: var(--text-main);
          font-weight: 800;
        }
        .pricing-subheading {
          font-size: 1.1rem;
          color: var(--text-muted);
          max-width: 600px;
        }
        
        /* Toggle Switch */
        .pricing-toggle-wrapper {
          display: flex;
          background: white;
          padding: 0.35rem;
          border-radius: 99px;
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-soft);
          gap: 0.25rem;
          margin-top: 0.5rem;
        }
        .toggle-btn {
          border: none;
          background: none;
          padding: 0.6rem 1.5rem;
          border-radius: 99px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .toggle-btn.active {
          background-color: var(--secondary);
          color: white;
        }
        .discount-tag {
          font-size: 0.75rem;
          background-color: var(--primary);
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 99px;
        }
        
        /* Pricing Cards Grid */
        .pricing-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 4rem;
          align-items: stretch;
        }
        .pricing-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: var(--shadow-card);
          transition: all 0.3s ease;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
        }
        .pricing-card.popular {
          border-color: var(--primary);
          border-width: 2px;
          transform: scale(1.02);
        }
        .pricing-card.popular:hover {
          transform: translateY(-4px) scale(1.02);
        }
        .popular-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background-color: var(--text-main);
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.35rem 1rem;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }
        
        .card-top {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.75rem;
        }
        .plan-name {
          font-size: 1.5rem;
          color: var(--primary);
          font-weight: 800;
        }
        .plan-target {
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .plan-price-block {
          display: flex;
          align-items: baseline;
          margin-top: 0.5rem;
          color: var(--text-main);
        }
        .price-symbol {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .price-amount {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .price-period {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .price-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        
        /* Action Buttons in Cards */
        .btn-starter-action {
          width: 100%;
          padding: 0.8rem;
          background-color: var(--primary-light);
          color: var(--primary);
          border: none;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.2s ease;
        }
        .btn-starter-action:hover {
          background-color: #d1fae5;
          transform: translateY(-1px);
        }
        .btn-pro-action {
          width: 100%;
          padding: 0.8rem;
          margin-bottom: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .btn-business-action {
          width: 100%;
          padding: 0.8rem;
          background-color: var(--accent);
          color: white;
          border: none;
          font-weight: 700;
          border-radius: 12px;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
        }
        .btn-business-action:hover {
          background-color: #d97706;
          transform: translateY(-1px);
        }
        
        .features-intro {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .plan-features-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .plan-features-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: var(--secondary);
          font-weight: 500;
        }
        .plan-features-list li svg {
          margin-top: 0.15rem;
          flex-shrink: 0;
        }
        
        /* Comparison Table */
        .comparison-table-wrapper {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-soft);
          padding: 3rem;
          margin-bottom: 4rem;
        }
        .comparison-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 2rem;
          text-align: center;
        }
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .comparison-table th, 
        .comparison-table td {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .comparison-table th {
          font-weight: 700;
          font-size: 1.05rem;
          color: var(--text-main);
        }
        .comparison-table th:not(:first-child) {
          text-align: center;
          width: 22%;
        }
        .comparison-table td:not(:first-child) {
          text-align: center;
        }
        .header-plan {
          display: block;
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 0.15rem;
        }
        .header-price {
          display: block;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .centered-icon {
          margin: 0 auto;
        }
        .text-red {
          color: #ef4444;
        }
        .text-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }
        .text-badge.text-muted {
          background-color: #f1f5f9;
          color: #475569;
        }
        .text-badge.text-emerald {
          background-color: var(--primary-light);
          color: var(--primary);
        }
        
        /* Lower Row: Commission + FAQs */
        .pricing-lower-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 3.5rem;
        }
        .commission-card, 
        .faqs-accordion-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-soft);
          padding: 3rem;
        }
        .lower-row-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 0.25rem;
        }
        .lower-row-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 500;
          margin-bottom: 2rem;
        }
        
        /* Commission flow diagram */
        .commission-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--bg-color);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          gap: 0.5rem;
        }
        .flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          text-align: center;
          flex: 1;
        }
        .flow-step .step-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .flow-step .step-value {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .flow-step.highlight {
          background-color: #fffbeb;
          border: 1px solid #fef3c7;
          padding: 0.75rem;
          border-radius: 12px;
        }
        .flow-step.success {
          background-color: var(--primary-light);
          border: 1px solid #d1fae5;
          padding: 0.75rem;
          border-radius: 12px;
        }
        .flow-arrow {
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }
        .commission-subtext {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
          text-align: center;
        }
        
        /* FAQs List Accordion */
        .faqs-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }
        .faq-item {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
        }
        .faq-question-btn {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
          padding: 0.5rem 0;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .faq-question-btn:hover {
          color: var(--primary);
        }
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0, 1, 0, 1);
        }
        .faq-item.open .faq-answer {
          max-height: 200px;
          transition: max-height 0.3s cubic-bezier(1, 0, 1, 0);
        }
        .faq-answer p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          padding: 0.5rem 0 1rem 0;
        }
        
        /* Bottom secure Badges */
        .pricing-badges-footer {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 1rem;
        }
        .badge-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .badge-separator {
          color: var(--border-color);
        }

        /* Responsive Breakpoints */
        @media (max-width: 1100px) {
          .pricing-cards-grid {
            grid-template-columns: 1fr;
            max-width: 460px;
            margin: 0 auto 4rem auto;
            gap: 2.5rem;
          }
          .pricing-card.popular {
            transform: none;
          }
          .pricing-card.popular:hover {
            transform: translateY(-4px);
          }
          .pricing-lower-row {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .pricing-heading {
            font-size: 2.25rem;
          }
          .comparison-table-wrapper {
            padding: 1.5rem;
          }
          .comparison-table th, 
          .comparison-table td {
            padding: 1rem 0.5rem;
            font-size: 0.85rem;
          }
          .commission-flow {
            flex-direction: column;
            gap: 1rem;
          }
          .flow-arrow {
            transform: rotate(90deg);
          }
          .commission-card, 
          .faqs-accordion-card {
            padding: 2rem 1.5rem;
          }
          .pricing-badges-footer {
            flex-direction: column;
            gap: 0.75rem;
          }
          .badge-separator {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
