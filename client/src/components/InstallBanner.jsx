import { Download, X, Smartphone } from 'lucide-react';

export default function InstallBanner({ onInstall, onDismiss }) {
  return (
    <div className="install-banner fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe sm:bottom-4 sm:left-4 sm:right-auto sm:w-80">
      <div className="flex items-start gap-3 p-3.5 bg-app-elevated border border-app-border-light rounded-2xl shadow-2xl shadow-black/40">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-label-primary">Install CloudPhotos</p>
          <p className="text-[11px] text-label-tertiary mt-0.5 leading-relaxed">
            Add to your home screen for the best experience.
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={onInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[12px] font-medium
                         active:scale-95 transition-transform"
            >
              <Download className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-label-tertiary
                         active:bg-white/5 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-label-quaternary active:text-label-tertiary transition-colors -mt-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
