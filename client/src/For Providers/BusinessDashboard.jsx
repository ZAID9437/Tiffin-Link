import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function BusinessDashboard({ onOpenBecomeProviderModal }) {
  return (
    <section id="providers" className="business-section">
      <div className="container business-container">
        {/* Left column - Info (50%) */}
        <div className="business-left">
          <span className="business-badge text-emerald font-semibold uppercase tracking-wider text-xs">
            For Tiffin Partners
          </span>
          <h2 className="business-heading">
            Everything a Tiffin Business Needs
          </h2>
          <p className="business-desc">
            Manage orders, inventory, customers and grow your business with our powerful all-in-one dashboard. Designed specifically for home chefs.
          </p>
          <button onClick={onOpenBecomeProviderModal} className="btn btn-primary business-btn">
            Become a Provider <ArrowRight size={18} />
          </button>
        </div>

        {/* Right column - Mockup (50%) */}
        <div className="business-right">
          <div className="dashboard-mockup-wrapper">
            <div className="dashboard-glow"></div>
            <img 
              src="/assets/dashboard_mockup.png" 
              alt="TiffinLink SaaS Dashboard Mockup" 
              className="dashboard-mockup-img"
            />
          </div>
        </div>
      </div>

      <style>{`
        .business-section {
          padding: 6.5rem 0;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(248, 250, 252, 1) 100%);
          border-bottom: 1px solid var(--border-color);
          overflow: hidden;
        }
        .business-container {
          display: grid;
          grid-template-columns: 45fr 55fr;
          gap: 5rem;
          align-items: center;
        }
        
        /* Left Column */
        .business-left {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
        }
        .business-badge {
          background-color: var(--primary-light);
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .business-heading {
          font-size: 2.75rem;
          line-height: 1.2;
          color: var(--text-main);
          font-weight: 800;
        }
        .business-desc {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
        }
        .business-btn {
          padding: 0.9rem 2.25rem;
          border-radius: 14px;
          box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
        }
        
        /* Right Column */
        .business-right {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .dashboard-mockup-wrapper {
          position: relative;
          width: 100%;
          border-radius: var(--radius-md);
          box-shadow: 0 30px 60px -15px rgba(15, 23, 42, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.6);
          overflow: hidden;
          transition: transform 0.5s ease;
          background: white;
        }
        .dashboard-mockup-wrapper:hover {
          transform: translateY(-5px) scale(1.02);
        }
        .dashboard-mockup-img {
          width: 100%;
          height: auto;
          display: block;
        }
        .dashboard-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          pointer-events: none;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .business-container {
            grid-template-columns: 1fr;
            gap: 4rem;
          }
          .business-left {
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
}
