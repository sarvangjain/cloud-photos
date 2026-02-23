import { useState } from 'react';
import { Link2, ExternalLink, LogOut, ChevronRight, ShieldCheck, KeyRound, Copy, ClipboardPaste, Check } from 'lucide-react';
import { saveAmazonCookies } from '../services/api';

const EXPORT_PREFIX = 'CLOUDPHOTOS_COOKIES::';

function encodeCookies(cookies) {
  return EXPORT_PREFIX + btoa(JSON.stringify(cookies));
}

function decodeCookies(str) {
  const trimmed = str.trim();
  if (trimmed.startsWith(EXPORT_PREFIX)) {
    return JSON.parse(atob(trimmed.slice(EXPORT_PREFIX.length)));
  }
  // Try raw JSON
  const parsed = JSON.parse(trimmed);
  if (parsed['session-id']) return parsed;
  throw new Error('Invalid format');
}

export default function AmazonConnect({ user, onConnected, onSignOut }) {
  const [step, setStep] = useState('intro'); // 'intro' | 'form' | 'import'
  const [cookies, setCookies] = useState({ 'session-id': '', 'ubid-main': '', 'at-main': '' });
  const [importText, setImportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const c = cookies;
    if (!c['session-id'] || !c['ubid-main'] || !c['at-main']) {
      setError('All three cookies are required.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await saveAmazonCookies(c);
      onConnected();
    } catch (err) {
      setError(err.message || 'Failed to connect.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setError(null);
    try {
      const parsed = decodeCookies(importText);
      if (!parsed['session-id'] || !parsed['ubid-main'] || !parsed['at-main']) {
        throw new Error('Missing required cookies in imported data.');
      }
      setLoading(true);
      await saveAmazonCookies(parsed);
      onConnected();
    } catch (err) {
      setError(err.message || 'Invalid import data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!cookies['session-id'] || !cookies['ubid-main'] || !cookies['at-main']) {
      setError('Fill in all cookies first to export.');
      return;
    }
    const encoded = encodeCookies(cookies);
    await navigator.clipboard.writeText(encoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-app-bg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-app-border">
        <div className="flex items-center gap-3">
          <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
          <span className="text-[13px] font-medium text-label-secondary">{user.displayName}</span>
        </div>
        <button onClick={onSignOut} className="text-label-tertiary hover:text-label-secondary transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-md w-full">

          {/* ========== INTRO ========== */}
          {step === 'intro' && (
            <div className="animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6">
                <Link2 className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="font-display text-[24px] font-semibold text-label-primary mb-2 tracking-tight">
                Connect Amazon Photos
              </h2>
              <p className="text-label-tertiary text-[14px] mb-8 leading-relaxed">
                Copy 3 browser cookies from Amazon, or import a previously exported cookie string.
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

              <div className="flex gap-3 mb-3">
                <a
                  href="https://www.amazon.com/photos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost flex-1 border border-app-border justify-center !py-2.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Amazon
                </a>
                <button onClick={() => { setStep('form'); setError(null); }} className="btn-primary flex-1">
                  I have my cookies
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { setStep('import'); setError(null); }}
                className="w-full btn-ghost border border-app-border justify-center !py-2.5"
              >
                <ClipboardPaste className="w-4 h-4" />
                Import cookies from string
              </button>

              <div className="mt-6 flex items-start gap-2.5 p-3 rounded-xl bg-accent/5 border border-accent/10">
                <ShieldCheck className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                <p className="text-[12px] text-accent/80 leading-relaxed">
                  Cookies are stored in your private Firestore document. Only you can access them.
                </p>
              </div>
            </div>
          )}

          {/* ========== MANUAL FORM ========== */}
          {step === 'form' && (
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

              <div className="space-y-4 mb-4">
                {['session-id', 'ubid-main', 'at-main'].map((key) => (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold text-label-tertiary mb-1.5 uppercase tracking-wider">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={cookies[key]}
                      onChange={(e) => setCookies((p) => ({ ...p, [key]: e.target.value.trim() }))}
                      placeholder={`Paste ${key} value`}
                      className="input-field font-mono text-[12px]"
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>

              {error && <p className="mb-4 text-[13px] text-red-400 animate-fade-in">{error}</p>}

              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting…</>
                  ) : (
                    <><Link2 className="w-4 h-4" /> Connect</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  className="btn-ghost border border-app-border !px-3"
                  title="Copy cookies as shareable string"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </form>
          )}

          {/* ========== IMPORT ========== */}
          {step === 'import' && (
            <div className="animate-fade-in">
              <button
                onClick={() => setStep('intro')}
                className="text-[13px] text-label-tertiary hover:text-label-secondary mb-6 flex items-center gap-1 transition-colors"
              >
                ← Back
              </button>

              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5">
                <ClipboardPaste className="w-6 h-6 text-green-400" />
              </div>

              <h2 className="font-display text-[22px] font-semibold text-label-primary mb-2 tracking-tight">
                Import Cookies
              </h2>
              <p className="text-label-tertiary text-[13px] mb-6">
                Paste the exported cookie string below. This is the string starting with <code className="text-accent/70 text-[11px]">CLOUDPHOTOS_COOKIES::</code>
              </p>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste cookie string here…"
                rows={4}
                className="input-field font-mono text-[11px] resize-none mb-4"
                autoComplete="off"
                spellCheck={false}
              />

              {error && <p className="mb-4 text-[13px] text-red-400 animate-fade-in">{error}</p>}

              <button
                onClick={handleImport}
                disabled={loading || !importText.trim()}
                className="btn-primary w-full"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Importing…</>
                ) : (
                  <><ClipboardPaste className="w-4 h-4" /> Import & Connect</>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
