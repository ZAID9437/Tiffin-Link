import React, { useState } from 'react';
import confetti from 'canvas-confetti';

export default function ContactSection() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !message) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${firstName} ${lastName}`,
          email,
          subject: 'Artisanal Culinary Inquiry',
          message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Confetti effect
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#1A1A1A', '#4A4238']
        });

        // Reset
        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('');
      }
    } catch (error) {
      console.error('Contact submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Contact Section */}
      <section className="pt-8 pb-section-gap bg-surface-container-low px-margin-desktop" id="contact">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <div className="md:col-span-4 reveal-on-scroll">
            <p className="font-label-caps text-label-caps text-secondary mb-8">GET IN TOUCH</p>
            <h2 className="font-headline-lg text-headline-lg mb-12">Start your culinary journey.</h2>
            <div className="space-y-4">
              <p className="font-body-lg text-body-lg">hello@tiffinlink.com</p>
              <p className="font-body-lg text-body-lg">+1 (800) TIFFIN-CRAFT</p>
              <p className="font-body-lg text-body-lg">840 Artisanal Way, Suite 400<br/>San Francisco, CA 94103</p>
            </div>
          </div>
          <div className="md:col-span-7 md:col-start-6 reveal-on-scroll">
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="relative pb-4 group">
                  <label className="font-label-caps text-label-caps text-secondary">FIRST NAME</label>
                  <input 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-md" 
                    type="text"
                    required
                  />
                  {/* Underline Animation */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-onyx-black scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
                <div className="relative pb-4 group">
                  <label className="font-label-caps text-label-caps text-secondary">LAST NAME</label>
                  <input 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-md" 
                    type="text"
                    required
                  />
                  {/* Underline Animation */}
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-onyx-black scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </div>
              <div className="relative pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary">EMAIL ADDRESS</label>
                <input 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-md" 
                  type="email"
                  required
                />
                {/* Underline Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-onyx-black scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
              <div className="relative pb-4 group">
                <label className="font-label-caps text-label-caps text-secondary">HOW CAN WE HELP?</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-transparent border-none p-0 py-2 focus:ring-0 text-body-md resize-none" 
                  rows={3}
                  required
                ></textarea>
                {/* Underline Animation */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-sand-neutral" />
                <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-onyx-black scale-x-0 group-hover:scale-x-100 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
              </div>
              <button 
                disabled={loading}
                type="submit"
                className="bg-onyx-black text-bone-white px-12 py-4 font-button-text hover:bg-clay-earth transition-all duration-500 scale-100 active:scale-95 hover:tracking-widest disabled:opacity-50"
              >
                {loading ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
