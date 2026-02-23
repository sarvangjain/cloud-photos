import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageOff, RefreshCw, Loader2 } from 'lucide-react';
import { searchPhotos } from '../services/api';
import PhotoCard from './PhotoCard';
import Toolbar, { StatusBar } from './Toolbar';

/** Group photos by date range */
function groupPhotosByDate(photos) {
  const groups = {};

  photos.forEach((photo) => {
    const d = photo.createdDate ? new Date(photo.createdDate) : null;
    if (!d || isNaN(d.getTime())) {
      const key = 'Unknown Date';
      if (!groups[key]) groups[key] = { label: key, sublabel: '', photos: [], sortKey: 0 };
      groups[key].photos.push(photo);
      return;
    }

    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const key = `${month}-${year}`;

    if (!groups[key]) {
      groups[key] = {
        label: '',
        sublabel: '',
        photos: [],
        sortKey: d.getTime(),
        month,
        year,
        minDay: d.getDate(),
        maxDay: d.getDate(),
      };
    }

    groups[key].photos.push(photo);
    groups[key].minDay = Math.min(groups[key].minDay, d.getDate());
    groups[key].maxDay = Math.max(groups[key].maxDay, d.getDate());
  });

  Object.values(groups).forEach((g) => {
    if (g.month) {
      g.label = g.minDay === g.maxDay
        ? `${g.minDay} ${g.month} ${g.year}`
        : `${g.minDay} - ${g.maxDay} ${g.month} ${g.year}`;
    }
  });

  return Object.values(groups).sort((a, b) => b.sortKey - a.sortKey);
}

export default function Gallery({ isMobile = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [gridSize, setGridSize] = useState(isMobile ? 3 : 7);
  const [lastUpdated, setLastUpdated] = useState(null);
  const observerRef = useRef(null);
  const navigate = useNavigate();

  const PAGE_SIZE = 60;
  const px = isMobile ? 'px-2' : 'px-5';

  const fetchPhotos = useCallback(async (offsetVal = 0, append = false) => {
    try {
      if (offsetVal === 0 && !append) setLoading(true);
      else if (append) setLoadingMore(true);

      const result = await searchPhotos({
        query: 'type:(PHOTOS)',
        offset: offsetVal,
        limit: PAGE_SIZE,
      });

      setPhotos((prev) => append ? [...prev, ...result.photos] : result.photos);
      setHasMore(result.hasMore);
      setOffset(offsetVal + result.photos.length);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setOffset(0);
    fetchPhotos(0, false);
  }, [fetchPhotos]);

  useEffect(() => {
    fetchPhotos(0);
  }, [fetchPhotos]);

  // Infinite scroll sentinel
  const sentinelRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPhotos(offset, true);
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, offset, fetchPhotos]
  );

  const groups = groupPhotosByDate(photos);

  // ---------- Error state ----------
  if (error && photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {!isMobile && (
          <Toolbar
            gridSize={gridSize}
            onGridSizeChange={setGridSize}
            onCamera={() => navigate('/camera')}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            isMobile={isMobile}
          />
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
            <ImageOff className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="font-medium text-label-primary mb-1 text-[15px]">Couldn't load photos</h3>
          <p className="text-[13px] text-label-tertiary mb-5 max-w-xs">{error}</p>
          <button onClick={handleRefresh} className="btn-primary text-[13px]">
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar — always show on desktop, compact on mobile */}
      <Toolbar
        gridSize={gridSize}
        onGridSizeChange={setGridSize}
        onCamera={() => navigate('/camera')}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        isMobile={isMobile}
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {loading && !refreshing ? (
          <div className={`${px} pt-4`}>
            <div className="skeleton h-5 w-40 rounded mb-1" />
            <div className="skeleton h-3 w-24 rounded mb-3" />
            <div className="photo-grid" style={{ '--grid-cols': gridSize }}>
              {Array.from({ length: gridSize * 3 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-sm" />
              ))}
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-app-surface flex items-center justify-center mb-4">
              <ImageOff className="w-8 h-8 text-label-tertiary" />
            </div>
            <h3 className="font-medium text-label-primary text-[16px] mb-1.5">No photos yet</h3>
            <p className="text-[13px] text-label-tertiary mb-6">
              {isMobile ? 'Tap the camera button to get started.' : 'Capture your first photo to get started.'}
            </p>
            {!isMobile && (
              <button onClick={() => navigate('/camera')} className="btn-primary text-[13px]">
                Open Camera
              </button>
            )}
          </div>
        ) : (
          <div className="pb-4">
            {groups.map((group, gi) => (
              <div key={gi} className="mb-1">
                {/* Group header */}
                <div className={`${px} pt-4 pb-1.5`}>
                  <h2 className={`font-semibold text-label-primary leading-tight ${isMobile ? 'text-[14px]' : 'text-[15px]'}`}>
                    {group.label}
                  </h2>
                </div>

                {/* Photo grid */}
                <div className={`photo-grid ${px}`} style={{ '--grid-cols': gridSize }}>
                  {group.photos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      onClick={() => navigate(`/photo/${photo.id}`, { state: { photo } })}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div ref={sentinelRef} className="h-1" />

            {loadingMore && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-label-tertiary animate-spin" />
              </div>
            )}

            <StatusBar
              photoCount={photos.length}
              hasMore={hasMore}
              lastUpdated={lastUpdated}
            />
          </div>
        )}
      </div>
    </div>
  );
}
