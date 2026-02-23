import { useState } from 'react';
import {
  Image,
  Heart,
  Clock,
  FolderOpen,
  Film,
  EyeOff,
  Trash2,
  Share2,
  Link2,
  Camera,
  LogOut,
  Unlink,
  ChevronDown,
  ChevronRight,
  Cloud,
} from 'lucide-react';
import { disconnectAmazon } from '../services/api';

export default function Sidebar({
  user,
  activeView,
  onViewChange,
  onSignOut,
  onDisconnect,
  collapsed,
}) {
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleDisconnect = async () => {
    try {
      await disconnectAmazon();
      onDisconnect();
    } catch (err) {
      console.error(err);
    }
  };

  if (collapsed) return null;

  return (
    <aside className="w-[220px] shrink-0 bg-app-sidebar/60 backdrop-blur-xl border-r border-app-border flex flex-col h-full select-none">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <Cloud className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display text-[15px] font-semibold text-label-primary tracking-tight">
          CloudPhotos
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 pb-3 space-y-0.5">
        {/* Photos section */}
        <div className="px-2 pt-3 pb-1.5">
          <span className="text-[11px] font-semibold text-label-tertiary uppercase tracking-wider">
            Photos
          </span>
        </div>

        <NavItem
          icon={Image}
          label="Library"
          active={activeView === 'library'}
          onClick={() => onViewChange('library')}
        />
        <NavItem
          icon={Heart}
          label="Favourites"
          active={activeView === 'favourites'}
          onClick={() => onViewChange('favourites')}
          disabled
        />
        <NavItem
          icon={Clock}
          label="Recents"
          active={activeView === 'recents'}
          onClick={() => onViewChange('recents')}
          disabled
        />

        {/* Collections */}
        <div className="px-2 pt-5 pb-1.5">
          <button
            onClick={() => setCollectionsOpen(!collectionsOpen)}
            className="flex items-center gap-1 text-[11px] font-semibold text-label-tertiary uppercase tracking-wider hover:text-label-secondary transition-colors"
          >
            {collectionsOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            Collections
          </button>
        </div>

        {collectionsOpen && (
          <>
            <NavItem icon={FolderOpen} label="Albums" disabled />
            <NavItem icon={Film} label="Media Types" disabled />
            <NavItem icon={EyeOff} label="Hidden" disabled />
            <NavItem icon={Trash2} label="Recently Deleted" disabled />
          </>
        )}
      </nav>

      {/* Bottom: user info */}
      <div className="shrink-0 border-t border-app-border p-2.5">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <img
              src={user.photoURL}
              alt=""
              className="w-7 h-7 rounded-full"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12px] font-medium text-label-primary truncate">{user.displayName}</p>
              <p className="text-[10px] text-label-tertiary truncate">{user.email}</p>
            </div>
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-app-elevated border border-app-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-scale-in origin-bottom-left">
                <button
                  onClick={() => { handleDisconnect(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-label-secondary hover:bg-white/5 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Disconnect Amazon
                </button>
                <div className="border-t border-app-border" />
                <button
                  onClick={() => { onSignOut(); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon: Icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`nav-item w-full ${active ? 'active' : ''} ${disabled ? 'opacity-35 cursor-default' : ''}`}
      disabled={disabled}
    >
      <Icon className="nav-icon" />
      <span>{label}</span>
    </button>
  );
}
