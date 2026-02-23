import { useState } from 'react';
import { Cloud } from 'lucide-react';

export default function Login({ onSignIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await onSignIn();
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 bg-app-bg relative overflow-auto">
      {/* Subtle gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-[22px] bg-gradient-to-b from-accent to-blue-600 flex items-center justify-center shadow-2xl shadow-accent/20">
            <Cloud className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-[32px] font-semibold text-label-primary mb-2 animate-slide-up tracking-tight">
          CloudPhotos
        </h1>
        <p className="text-label-tertiary text-[14px] text-center mb-10 animate-slide-up leading-relaxed" style={{ animationDelay: '0.05s' }}>
          Your photos. Your Amazon cloud.
        </p>

        {/* Google sign in */}
        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl
                     bg-app-surface border border-app-border
                     hover:bg-app-elevated hover:border-app-border-light
                     active:scale-[0.98] transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed
                     animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-label-tertiary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span className="font-medium text-[14px] text-label-primary">
            {loading ? 'Signing in…' : 'Continue with Google'}
          </span>
        </button>

        {error && (
          <p className="mt-4 text-[13px] text-red-400 text-center animate-fade-in">{error}</p>
        )}

        <p className="mt-10 text-[11px] text-label-quaternary text-center leading-relaxed">
          Photos are stored in your own Amazon Photos account.
          <br />
          Nothing is stored on our servers.
        </p>
      </div>
    </div>
  );
}
