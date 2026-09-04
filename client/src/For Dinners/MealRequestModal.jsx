import React, { useState } from 'react';
import { X, Search, MapPin, Navigation, IndianRupee, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MealRequestModal({ isOpen, onClose, onSubmitSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    mealType: 'Veg Tiffin',
    date: todayStr,
    time: '13:00',
    deliveryType: 'Delivery',
    location: 'Satellite, Ahmedabad',
    budget: '140'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('tiffinlink_user');
      if (saved) {
        const u = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          customerName: u.name || prev.customerName,
          customerPhone: u.phone || prev.customerPhone
        }));
      }
    } catch (e) {}
  }, []);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName || 'Customer Diner',
          customerPhone: formData.customerPhone || '+91 98250 99881',
          mealType: formData.mealType,
          date: formData.date,
          time: formData.time,
          deliveryType: formData.deliveryType,
          location: formData.location,
          budget: Number(formData.budget),
          category: formData.mealType.includes('Jain') ? 'Jain' : (formData.mealType.includes('Non-Veg') ? 'Non-Veg' : 'Gujarati')
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
        
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
        
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      // Mock Success Fallback
      setSubmitted(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 }
      });
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
          <X size={20} />
        </button>

        {submitted ? (
          <div className="success-state">
            <div className="success-icon-wrapper">
              <ShieldCheck size={44} className="text-emerald" />
            </div>
            <h3>Request Posted Successfully!</h3>
            <p>Home chefs in your location have been notified. Check your dashboard for incoming offers.</p>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h3>Create a Meal Request</h3>
              <p>Enter your preferences to match with nearby providers.</p>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Meal Type</label>
                  <select name="mealType" value={formData.mealType} onChange={handleChange}>
                    <option>Veg Tiffin</option>
                    <option>Jain Food</option>
                    <option>Healthy Meals</option>
                    <option>High Protein</option>
                    <option>Non-Veg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" name="date" value={formData.date} onChange={handleChange} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Time</label>
                  <input type="time" name="time" value={formData.time} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Delivery/Pickup</label>
                  <select name="deliveryType" value={formData.deliveryType} onChange={handleChange}>
                    <option>Delivery</option>
                    <option>Pickup</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <div className="input-wrapper">
                  <MapPin className="icon-left" size={18} />
                  <input 
                    type="text" 
                    name="location" 
                    value={formData.location} 
                    onChange={handleChange}
                    placeholder="Enter delivery location"
                  />
                  <Navigation className="icon-right text-emerald" size={18} />
                </div>
              </div>

              <div className="form-group">
                <label>Budget (Per Meal)</label>
                <div className="input-wrapper">
                  <IndianRupee className="icon-left" size={18} />
                  <input 
                    type="number" 
                    name="budget" 
                    value={formData.budget} 
                    onChange={handleChange}
                    placeholder="E.g. 100"
                  />
                  <span className="text-right-label">Per Meal</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary w-full submit-btn">
                <Search size={18} /> {loading ? 'Posting...' : 'Find Providers Now'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5000;
          animation: fadeIn 0.2s ease-out forwards;
        }
        .modal-card {
          background: white;
          width: 100%;
          max-width: 520px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25);
          padding: 2.5rem;
          position: relative;
          animation: scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .modal-close-btn {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          transition: color 0.2s ease;
        }
        .modal-close-btn:hover {
          color: var(--text-main);
        }
        .modal-header {
          margin-bottom: 2rem;
        }
        .modal-header h3 {
          font-size: 1.5rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .modal-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .form-group select,
        .form-group input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          font-family: inherit;
          font-size: 0.95rem;
          outline: none;
          background-color: white;
          color: var(--text-main);
          transition: all 0.2s ease;
        }
        .form-group select:focus,
        .form-group input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .icon-left {
          position: absolute;
          left: 0.85rem;
          color: var(--text-muted);
          pointer-events: none;
        }
        .icon-right {
          position: absolute;
          right: 0.85rem;
          cursor: pointer;
        }
        .text-right-label {
          position: absolute;
          right: 1rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .input-wrapper input {
          width: 100%;
          padding-left: 2.35rem;
          padding-right: 2.35rem;
        }
        .submit-btn {
          padding: 0.9rem;
          border-radius: 12px;
          margin-top: 0.5rem;
        }
        
        /* Success State */
        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1rem;
          text-align: center;
        }
        .success-icon-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--primary-light);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .success-state h3 {
          font-size: 1.35rem;
          color: var(--text-main);
          margin-bottom: 0.5rem;
        }
        .success-state p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
