import {
  Camera,
  RefreshCw,
  Minus,
  Plus,
  Grid3x3,
} from 'lucide-react';

export default function Toolbar({
  gridSize,
  onGridSizeChange,
  onCamera,
  onRefresh,
  refreshing,
  isMobile = false,
}) {
  return (
    <div className={`flex items-center justify-between border-b border-app-border bg-app-bg/80 backdrop-blur-xl shrink-0 ${
      isMobile ? 'px-3 h-[38px]' : 'px-5 h-[44px]'
    }`}>
      {/* Left: grid controls */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          /* Mobile: simple +/- buttons */
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onGridSizeChange(Math.min(gridSize + 1, 6))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-label-tertiary active:bg-app-surface transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-label-tertiary font-medium tabular-nums w-3 text-center">
              {gridSize}
            </span>
            <button
              onClick={() => onGridSizeChange(Math.max(gridSize - 1, 2))}
              className="w-7 h-7 rounded-md flex items-center justify-center text-label-tertiary active:bg-app-surface transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Desktop: slider */
          <div className="flex items-center gap-2">
            <button
              onClick={() => onGridSizeChange(Math.min(gridSize + 1, 10))}
              className="text-label-tertiary hover:text-label-secondary transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min="3"
              max="10"
              value={gridSize}
              onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
              className="w-20"
              style={{ direction: 'rtl' }}
            />
            <button
              onClick={() => onGridSizeChange(Math.max(gridSize - 1, 3))}
              className="text-label-tertiary hover:text-label-secondary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={`flex items-center justify-center rounded-md text-label-secondary transition-colors ${
            isMobile
              ? 'w-8 h-8 active:bg-app-surface'
              : 'btn-ghost !px-2'
          }`}
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin-slow' : ''}`} />
        </button>
        {!isMobile && (
          <button
            onClick={onCamera}
            className="btn-ghost !px-2"
            title="Capture"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Status bar */
export function StatusBar({ photoCount, hasMore, lastUpdated }) {
  return (
    <div className="flex items-center justify-center py-6 text-[12px] text-label-tertiary select-none">
      <span>
        {photoCount?.toLocaleString() || 0}{hasMore ? '+' : ''} Photos
      </span>
      {lastUpdated && (
        <span className="ml-1.5">
          · Updated at {lastUpdated}
        </span>
      )}
    </div>
  );
}
