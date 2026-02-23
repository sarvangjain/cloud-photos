import { Image, Camera, Clock, Settings } from 'lucide-react';

export default function MobileTabBar({ activeView, onViewChange, onCamera, onSettings }) {
  return (
    <div className="tab-bar shrink-0 bg-app-sidebar/90 backdrop-blur-xl border-t border-app-border flex items-center justify-around px-2 pt-1">
      <TabItem
        icon={Image}
        label="Library"
        active={activeView === 'library'}
        onClick={() => onViewChange('library')}
      />
      <TabItem
        icon={Clock}
        label="Recents"
        active={activeView === 'recents'}
        disabled
      />
      <CaptureButton onClick={onCamera} />
      <TabItem
        icon={Image}
        label="Albums"
        active={activeView === 'albums'}
        disabled
      />
      <TabItem
        icon={Settings}
        label="Settings"
        active={activeView === 'settings'}
        onClick={() => onSettings?.()}
      />
    </div>
  );
}

function TabItem({ icon: Icon, label, active, onClick, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`tab-item ${active ? 'active' : ''} ${disabled ? 'opacity-30' : ''}`}
      disabled={disabled}
    >
      <Icon className="tab-icon" strokeWidth={active ? 2 : 1.5} />
      <span className="tab-label">{label}</span>
    </button>
  );
}

function CaptureButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-accent shadow-lg shadow-accent/30 active:scale-90 transition-transform"
    >
      <Camera className="w-5 h-5 text-white" />
    </button>
  );
}
