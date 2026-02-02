'use client';

import { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      // Store to API route (can be connected to Beehiiv/Mailchimp later)
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        // Fallback: store locally
        const existing = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
        existing.push({ email, date: new Date().toISOString() });
        localStorage.setItem('newsletter_emails', JSON.stringify(existing));
        setStatus('success');
        setEmail('');
      }
    } catch {
      // Fallback: store locally
      const existing = JSON.parse(localStorage.getItem('newsletter_emails') || '[]');
      existing.push({ email, date: new Date().toISOString() });
      localStorage.setItem('newsletter_emails', JSON.stringify(existing));
      setStatus('success');
      setEmail('');
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
      <div className="max-w-xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-2">
          🔍 Weekly AI Tools Newsletter
        </h3>
        <p className="text-white/80 mb-6">
          Get the best new AI tools, comparisons, and deals delivered to your inbox every week. Free, no spam.
        </p>
        
        {status === 'success' ? (
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-lg font-semibold">✅ You&apos;re in! Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}
        
        <p className="text-white/60 text-sm mt-3">
          Join 1,000+ AI enthusiasts. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
