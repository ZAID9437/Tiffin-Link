import React from 'react';

export default function AppDownload() {
  return (
    <section className="download-section">
      <div className="container">
        <div className="download-card">
          {/* Background shapes */}
          <div className="download-bg-shape shape-1"></div>
          <div className="download-bg-shape shape-2"></div>

          {/* Left - App details and QR */}
          <div className="download-left">
            <div className="qr-group">
              <div className="qr-container">
                <img src="/assets/qr_code.png" alt="TiffinLink App QR Code" className="qr-img" />
              </div>
              <div className="qr-text">
                <h3 className="download-heading">Get the TiffinLink App</h3>
                <p className="download-desc">
                  Faster. Smarter. <br />
                  Home-cooked meals in one tap.
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="store-badges">
              <a href="#playstore" className="store-badge-link">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="store-badge-img"
                />
              </a>
              <a href="#appstore" className="store-badge-link">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  className="store-badge-img"
                />
              </a>
            </div>
          </div>

          {/* Right - Floating Phone Mockup */}
          <div className="download-right">
            <div className="phone-mockup-wrapper">
              <img 
                src="/assets/phone_mockup.png" 
                alt="TiffinLink App Screen" 
                className="phone-mockup-img" 
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .download-section {
          padding: 6rem 0;
          background-color: var(--bg-color);
          overflow: hidden;
        }
        .download-card {
          background: white;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-soft);
          padding: 4rem 5rem;
          display: grid;
          grid-template-columns: 55fr 45fr;
          gap: 3rem;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        /* Background decorative blobs */
        .download-bg-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 1;
          pointer-events: none;
        }
        .shape-1 {
          width: 300px;
          height: 300px;
          background: rgba(16, 185, 129, 0.08);
          bottom: -100px;
          left: 10%;
        }
        .shape-2 {
          width: 350px;
          height: 350px;
          background: rgba(16, 185, 129, 0.05);
          top: -150px;
          right: -50px;
        }
        
        .download-left {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          z-index: 2;
        }
        .qr-group {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        .qr-container {
          width: 120px;
          height: 120px;
          border: 1px solid var(--border-color);
          padding: 0.5rem;
          border-radius: 16px;
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .qr-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .download-heading {
          font-size: 2.25rem;
          color: var(--text-main);
          font-weight: 800;
        }
        .download-desc {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.4;
          font-weight: 500;
        }
        .store-badges {
          display: flex;
          gap: 1rem;
        }
        .store-badge-img {
          height: 44px;
          display: block;
          transition: transform 0.2s ease;
        }
        .store-badge-img:hover {
          transform: translateY(-2px);
        }
        
        .download-right {
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2;
          position: relative;
          height: 100%;
        }
        .phone-mockup-wrapper {
          position: absolute;
          bottom: -5rem; /* Extends outside container for app mockup look */
          width: 320px;
        }
        .phone-mockup-img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 25px 35px rgba(15, 23, 42, 0.15));
          animation: float 6s ease-in-out infinite;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .download-card {
            grid-template-columns: 1fr;
            padding: 4rem 3rem 20rem 3rem; /* Leave room for phone mockup at bottom */
            gap: 4rem;
            text-align: center;
          }
          .qr-group {
            flex-direction: column;
            gap: 1.5rem;
          }
          .store-badges {
            justify-content: center;
          }
          .phone-mockup-wrapper {
            position: absolute;
            bottom: -5rem;
            left: 50%;
            transform: translateX(-50%);
          }
        }
        
        @media (max-width: 480px) {
          .download-card {
            padding: 3rem 1.5rem 15rem 1.5rem;
          }
          .download-heading {
            font-size: 1.75rem;
          }
          .store-badges {
            flex-direction: column;
            align-items: center;
          }
          .phone-mockup-wrapper {
            width: 240px;
          }
        }
      `}</style>
    </section>
  );
}
