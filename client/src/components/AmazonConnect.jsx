import { useState } from 'react';
import { Link2, ExternalLink, LogOut, ChevronRight, ShieldCheck, KeyRound } from 'lucide-react';
import { saveAmazonCookies } from '../services/api';

export default function AmazonConnect({ user, onConnected, onSignOut }) {
  const [step, setStep] = useState('intro'); // 'intro' | 'form'
  const [cookies, setCookies] = useState({ 'session-id': '', 'ubid-main': '', 'at-main': '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cookies['session-id'] || !cookies['ubid-main'] || !cookies['at-main']) {
      setError('All three cookies are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await saveAmazonCookies(cookies);
      onConnected();
    } catch (err) {
      setError(err.message || 'Failed to connect. Check your cookies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-auto">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-app-border">
        <div className="flex items-center gap-3">
          <img
            src={user.photoURL}
            alt=""
            className="w-7 h-7 rounded-full"
            referrerPolicy="no-referrer"
          />
          <span className="text-[13px] font-medium text-label-secondary">{user.displayName}</span>
        </div>
        <button onClick={onSignOut} className="text-label-tertiary hover:text-label-secondary transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-md w-full">
          {step === 'intro' ? (
            <div className="animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Link2 className="w-7 h-7 text-amber-400" />
              </div>

              <h2 className="font-display text-[24px] font-semibold text-label-primary mb-2 tracking-tight">
                Connect Amazon Photos
              </h2>
              <p className="text-label-tertiary text-[14px] mb-8 leading-relaxed">
                To store your photos, we need to connect to your Amazon Photos account.
                This requires copying 3 browser cookies — it takes about 2 minutes.
              </p>

              <div className="space-y-3 mb-8">
                {[
                  { n: '1', title: 'Open Amazon Photos', desc: 'Go to amazon.com/photos and log in' },
                  { n: '2', title: 'Open Developer Tools', desc: 'Press F12 → Application → Cookies' },
                  { n: '3', title: 'Copy 3 cookies', desc: 'session-id, ubid-main, at-main' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-3.5 rounded-xl bg-app-surface/60 border border-app-border">
                    <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center text-[12px] font-bold shrink-0">
                      {s.n}
                    </div>
                    <div>
                      <p className="font-medium text-label-primary text-[13px]">{s.title}</p>
                      <p className="text-label-tertiary text-[12px] mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <a
                  href="https://www.amazon.com/photos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost flex-1 border border-app-border justify-center !py-2.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Amazon
                </a>
                <button onClick={() => setStep('form')} className="btn-primary flex-1">
                  I have my cookies
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/10">
                <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <p className="text-[12px] text-accent/80 leading-relaxed">
                  Your cookies are encrypted with AES-256 and stored locally. They're never shared with anyone.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="text-[13px] text-label-tertiary hover:text-label-secondary mb-6 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-5">
                <KeyRound className="w-6 h-6 text-accent" />
              </div>

              <h2 className="font-display text-[22px] font-semibold text-label-primary mb-2 tracking-tight">
                Enter Amazon Cookies
              </h2>
              <p className="text-label-tertiary text-[13px] mb-6">
                Paste each cookie value from your browser's developer tools.
              </p>

              <div className="space-y-4 mb-6">
                {[
                  { key: 'session-id', label: 'session-id' },
                  { key: 'ubid-main', label: 'ubid-main' },
                  { key: 'at-main', label: 'at-main' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold text-label-tertiary mb-1.5 uppercase tracking-wider">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={cookies[key]}
                      onChange={(e) => setCookies((prev) => ({ ...prev, [key]: e.target.value.trim() }))}
                      placeholder={`Paste ${label} value`}
                      className="input-field font-mono text-[12px]"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p className="mb-4 text-[13px] text-red-400 animate-fade-in">{error}</p>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Connect Amazon Photos
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
