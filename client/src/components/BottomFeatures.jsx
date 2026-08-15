import React from 'react';
import { ShieldCheck, CalendarX, Headset, ShoppingBag } from 'lucide-react';

export default function BottomFeatures() {
  const items = [
    {
      icon: <ShieldCheck className="text-emerald" size={24} />,
      title: "Safe & Secure",
      desc: "100% secure payments"
    },
    {
      icon: <CalendarX className="text-emerald" size={24} />,
      title: "Easy Cancellation",
      desc: "Hassle-free cancellation"
    },
    {
      icon: <Headset className="text-emerald" size={24} />,
      title: "24/7 Support",
      desc: "We are here to help"
    },
    {
      icon: <ShoppingBag className="text-emerald" size={24} />,
      title: "No Minimum Order",
      desc: "Order as per your need"
    }
  ];

  return (
    <section className="bottom-features-section">
      <div className="container">
        <div className="bottom-features-grid">
          {items.map((item, index) => (
            <div key={index} className="bottom-feature-item">
              <div className="bottom-feature-icon-wrapper">
                {item.icon}
              </div>
              <div className="bottom-feature-text">
                <h4 className="bottom-feature-title">{item.title}</h4>
                <p className="bottom-feature-desc">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .bottom-features-section {
          padding: 3rem 0;
          background-color: white;
          border-top: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
        }
        .bottom-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2rem;
        }
        .bottom-feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .bottom-feature-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background-color: var(--primary-light);
          flex-shrink: 0;
        }
        .bottom-feature-text {
          display: flex;
          flex-direction: column;
        }
        .bottom-feature-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .bottom-feature-desc {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .bottom-features-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }
        @media (max-width: 560px) {
          .bottom-features-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </section>
  );
}
