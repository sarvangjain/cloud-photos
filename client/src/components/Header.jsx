import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Unlink, Settings, X } from 'lucide-react';
import { disconnectAmazon } from '../services/api';

export default function Header({ user, onSignOut, onDisconnect }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-lg text-stone-900">CloudPhotos</span>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Camera FAB */}
          <button
            onClick={() => navigate('/camera')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-700 text-white text-sm font-medium
                       hover:bg-brand-800 active:scale-[0.97] transition-all duration-150 shadow-sm shadow-brand-700/20"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Capture</span>
          </button>

          {/* Profile menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-brand-200 transition-all"
            >
              <img
                src={user.photoURL}
                alt=""
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-stone-900/10 border border-stone-100 py-2 animate-scale-in origin-top-right">
                {/* User info */}
                <div className="px-4 py-3 border-b border-stone-100">
                  <p className="font-medium text-sm text-stone-800 truncate">{user.displayName}</p>
                  <p className="text-xs text-stone-500 truncate">{user.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    <Unlink className="w-4 h-4" />
                    Disconnect Amazon
                  </button>
                  <button
                    onClick={() => { onSignOut(); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
