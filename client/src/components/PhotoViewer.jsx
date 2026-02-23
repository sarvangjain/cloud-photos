import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X, Download, Loader2, ChevronLeft, Share2 } from 'lucide-react';
import { loadAuthImage } from '../services/api';

export default function PhotoViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const photo = location.state?.photo || null;

  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const blobUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    loadAuthImage(id, 'full', photo?.tempLink)
      .then((url) => {
        if (!cancelled) {
          blobUrlRef.current = url;
          setSrc(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [id, photo?.tempLink]);

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = photo?.name || `photo-${id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!src || !navigator.share) return;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], photo?.name || 'photo.jpg', { type: 'image/jpeg' });
      await navigator.share({ files: [file], title: 'CloudPhotos' });
    } catch {
      // User cancelled or not supported
    }
  };

  // Close with Escape key or back swipe
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') navigate(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top bar */}
      <div
        className="relative z-10 flex items-center justify-between px-4 shrink-0 bg-black/60 backdrop-blur-xl"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)', paddingBottom: '6px' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-accent active:opacity-70 transition-opacity text-[15px] font-medium py-1"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex items-center gap-1">
          {src && navigator.share && (
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full flex items-center justify-center text-label-secondary
                         active:bg-white/10 transition-colors"
              title="Share"
            >
              <Share2 className="w-[18px] h-[18px]" />
            </button>
          )}
          {src && (
            <button
              onClick={handleDownload}
              className="w-10 h-10 rounded-full flex items-center justify-center text-label-secondary
                         active:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Image area */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-2 sm:p-4">
        {loading && (
          <Loader2 className="w-6 h-6 text-label-tertiary animate-spin" />
        )}

        {error && (
          <div className="text-center px-6">
            <p className="text-label-tertiary text-[13px] mb-3">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="text-accent text-[13px] active:opacity-70"
            >
              Go back
            </button>
          </div>
        )}

        {src && (
          <img
            src={src}
            alt={photo?.name || 'Photo'}
            className="max-w-full max-h-full w-auto h-auto object-contain animate-fade-in select-none"
            draggable={false}
          />
        )}
      </div>

      {/* Bottom info */}
      {photo && src && (
        <div
          className="shrink-0 flex items-center justify-center bg-black/60 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)', paddingTop: '8px' }}
        >
          <p className="text-[11px] sm:text-[12px] text-label-tertiary text-center px-4">
            {photo.name}
            {photo.createdDate && (
              <span className="ml-1.5 text-label-quaternary">
                · {new Date(photo.createdDate).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
