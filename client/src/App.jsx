import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useIsMobile } from './hooks/useIsMobile';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { getAmazonStatus } from './services/api';
import Login from './components/Login';
import AmazonConnect from './components/AmazonConnect';
import Gallery from './components/Gallery';
import Camera from './components/Camera';
import PhotoViewer from './components/PhotoViewer';
import Sidebar from './components/Sidebar';
import MobileTabBar from './components/MobileTabBar';
import MobileHeader from './components/MobileHeader';
import InstallBanner from './components/InstallBanner';

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [amazonConnected, setAmazonConnected] = useState(false);
  const [checkingAmazon, setCheckingAmazon] = useState(false);
  const [activeView, setActiveView] = useState('library');
  const isMobile = useIsMobile();
  const { canInstall, install, dismiss } = useInstallPrompt();
  const navigate = useNavigate();
  const location = useLocation();

  // Check Amazon connection when user logs in
  useEffect(() => {
    if (!user) {
      setAmazonConnected(false);
      return;
    }
    setCheckingAmazon(true);
    getAmazonStatus()
      .then(({ connected }) => setAmazonConnected(connected))
      .catch(() => setAmazonConnected(false))
      .finally(() => setCheckingAmazon(false));
  }, [user]);

  // Loading spinner
  if (loading || checkingAmazon) {
    return (
      <div className="h-full flex items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] text-label-tertiary">Loading…</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return <Login onSignIn={signIn} />;
  }

  // Amazon not connected
  if (!amazonConnected) {
    return (
      <AmazonConnect
        user={user}
        onConnected={() => setAmazonConnected(true)}
        onSignOut={signOut}
      />
    );
  }

  // Full-screen views (camera, photo viewer) — no shell
  const isFullScreen = location.pathname === '/camera' || location.pathname.startsWith('/photo/');

  if (isFullScreen) {
    return (
      <Routes>
        <Route path="/camera" element={<Camera onCapture={() => navigate('/')} />} />
        <Route path="/photo/:id" element={<PhotoViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  const handleDisconnect = () => {
    setAmazonConnected(false);
    navigate('/');
  };

  // =================== MOBILE LAYOUT ===================
  if (isMobile) {
    return (
      <div className="h-full bg-app-bg flex flex-col">
        <MobileHeader
          user={user}
          onSignOut={signOut}
          onDisconnect={handleDisconnect}
        />

        <main className="flex-1 min-h-0 flex flex-col">
          <Routes>
            <Route path="/" element={<Gallery isMobile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <MobileTabBar
          activeView={activeView}
          onViewChange={(view) => {
            setActiveView(view);
            navigate('/');
          }}
          onCamera={() => navigate('/camera')}
        />

        {canInstall && <InstallBanner onInstall={install} onDismiss={dismiss} />}
      </div>
    );
  }

  // =================== DESKTOP LAYOUT ===================
  return (
    <div className="h-full bg-app-bg flex">
      <Sidebar
        user={user}
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          navigate('/');
        }}
        onSignOut={signOut}
        onDisconnect={handleDisconnect}
      />

      <main className="flex-1 flex flex-col min-w-0 h-full">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {canInstall && <InstallBanner onInstall={install} onDismiss={dismiss} />}
    </div>
  );
}
