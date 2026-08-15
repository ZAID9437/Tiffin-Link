import React, { useState } from 'react';
import { X, Search, CheckSquare, Sparkles, Smile, ArrowRight } from 'lucide-react';

export default function DemoModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const steps = [
    {
      icon: <Search size={40} className="text-emerald" />,
      title: "1. Create a Request",
      desc: "Fill in your meal type, delivery location, preferred delivery time, and budget. It takes less than 30 seconds."
    },
    {
      icon: <Sparkles size={40} className="text-emerald" />,
      title: "2. Receive Personalized Offers",
      desc: "Nearby verified kitchens and home chefs see your request and send you customized offers detailing their menu, pricing, rating, and ETA."
    },
    {
      icon: <CheckSquare size={40} className="text-emerald" />,
      title: "3. Choose the Best Match",
      desc: "Compare ratings, menus, prices, and ETA. Choose the offer that fits your needs perfectly."
    },
    {
      icon: <Smile size={40} className="text-emerald" />,
      title: "4. Enjoy Fresh Home-Cooked Food",
      desc: "Your meal is freshly prepared by your chosen home chef and delivered hot to your doorstep. Rated 4.8 stars by our users."
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card demo-modal-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <h3>How TiffinLink Works</h3>
          <p>The smartest marketplace for home-cooked meals.</p>
        </div>

        {/* Steps visual progress */}
        <div className="demo-progress-bar">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`progress-step ${idx <= step ? 'active' : ''}`}
              onClick={() => setStep(idx)}
            >
              <span>{idx + 1}</span>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        <div className="demo-step-content">
          <div className="demo-icon-wrapper">
            {steps[step].icon}
          </div>
          <h3>{steps[step].title}</h3>
          <p>{steps[step].desc}</p>
        </div>

        {/* Navigation Buttons */}
        <div className="demo-nav-actions">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn btn-outline">
              Back
            </button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="btn btn-primary ml-auto">
              Next Step <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={onClose} className="btn btn-primary ml-auto">
              Got It, Thanks!
            </button>
          )}
        </div>
      </div>

      <style>{`
        .demo-modal-card {
          max-width: 500px;
          text-align: center;
        }
        .ml-auto {
          margin-left: auto;
        }
        .demo-progress-bar {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1.5rem;
          margin: 1.5rem 0 2.5rem 0;
          position: relative;
        }
        .demo-progress-bar::before {
          content: '';
          position: absolute;
          width: 60%;
          height: 2px;
          background-color: var(--border-color);
          z-index: 1;
        }
        .progress-step {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: white;
          border: 2px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--text-muted);
          z-index: 2;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .progress-step.active {
          border-color: var(--primary);
          background-color: var(--primary);
          color: white;
        }
        
        .demo-step-content {
          min-height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .demo-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulseGreen 2s infinite;
        }
        .demo-step-content h3 {
          font-size: 1.25rem;
          color: var(--text-main);
        }
        .demo-step-content p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 400px;
        }
        
        .demo-nav-actions {
          display: flex;
          align-items: center;
          width: 100%;
        }
        
        @keyframes pulseGreen {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
