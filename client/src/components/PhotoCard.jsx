import { useState, useEffect, useRef } from 'react';
import { loadAuthImage } from '../services/api';

export default function PhotoCard({ photo, onClick }) {
  const [src, setSrc] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef(null);
  const blobUrlRef = useRef(null);

  // Lazy load when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;

    loadAuthImage(photo.id, 'thumbnail', photo.tempLink)
      .then((url) => {
        if (!cancelled) {
          blobUrlRef.current = url;
          setSrc(url);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [inView, photo.id, photo.tempLink]);

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="aspect-square relative overflow-hidden bg-app-surface group focus:outline-none focus:ring-1 focus:ring-accent/50 rounded-sm"
    >
      {/* Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 skeleton" />
      )}

      {/* Image */}
      {src && (
        <img
          src={src}
          alt={photo.name || ''}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          draggable={false}
        />
      )}

      {/* Error placeholder */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-label-quaternary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25a1.5 1.5 0 001.5 1.5z" />
          </svg>
        </div>
      )}

      {/* Hover border highlight */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-accent/50 transition-colors duration-150 pointer-events-none rounded-sm" />

      {/* Video duration badge */}
      {photo.contentType?.startsWith('video') && photo.duration && (
        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium tabular-nums">
          {photo.duration}
        </div>
      )}
    </button>
  );
}
