import { useState, useRef, useEffect } from 'react';
import { Cloud, LogOut, Unlink } from 'lucide-react';
import { disconnectAmazon } from '../services/api';

export default function MobileHeader({ user, onSignOut, onDisconnect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  const handleDisconnect = async () => {
    try {
      await disconnectAmazon();
      onDisconnect();
    } catch (err) {
      console.error(err);
    }
    setMenuOpen(false);
  };

  return (
    <div className="shrink-0 flex items-center justify-between px-4 bg-app-bg/80 backdrop-blur-xl border-b border-app-border"
         style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)', paddingBottom: '8px' }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <Cloud className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display text-[17px] font-semibold text-label-primary tracking-tight">
          Library
        </span>
      </div>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent active:ring-accent/40 transition-all"
        >
          <img
            src={user.photoURL}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 w-56 bg-app-elevated border border-app-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50 animate-scale-in origin-top-right">
              <div className="px-3 py-2.5 border-b border-app-border">
                <p className="text-[13px] font-medium text-label-primary truncate">{user.displayName}</p>
                <p className="text-[11px] text-label-tertiary truncate">{user.email}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-label-secondary active:bg-white/5 transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Disconnect Amazon
              </button>
              <div className="border-t border-app-border" />
              <button
                onClick={() => { onSignOut(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 active:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
