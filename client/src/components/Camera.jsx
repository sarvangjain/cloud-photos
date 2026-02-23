import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera as CameraIcon,
  X,
  SwitchCamera,
  Check,
  RotateCcw,
  Upload,
  Loader2,
  Zap,
  ZapOff,
  ImagePlus,
} from 'lucide-react';
import { uploadPhoto } from '../services/api';

export default function Camera({ onCapture }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('camera'); // 'camera' | 'preview' | 'uploading' | 'done'
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  // Start camera
  const startCamera = useCallback(async (facing = facingMode) => {
    try {
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please allow camera permissions.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Capture photo
  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    // Flash effect
    if (flashEnabled) {
      const flashEl = document.getElementById('flash-overlay');
      if (flashEl) {
        flashEl.style.opacity = '1';
        setTimeout(() => (flashEl.style.opacity = '0'), 150);
      }
    }

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    canvas.toBlob(
      (blob) => {
        setCapturedBlob(blob);
        setMode('preview');
      },
      'image/jpeg',
      0.92
    );
  }, [flashEnabled]);

  // Switch camera
  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  // Retake
  const retake = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setUploadError(null);
    setMode('camera');
  }, []);

  // Upload
  const handleUpload = useCallback(async () => {
    if (!capturedBlob) return;
    setMode('uploading');
    setUploadError(null);

    try {
      const filename = `CloudPhotos_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`;
      await uploadPhoto(capturedBlob, filename);
      setMode('done');
      setTimeout(() => {
        onCapture?.();
      }, 1200);
    } catch (err) {
      setUploadError(err.message);
      setMode('preview');
    }
  }, [capturedBlob, onCapture]);

  // Handle file upload from gallery
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedImage(URL.createObjectURL(file));
    setCapturedBlob(file);
    setMode('preview');
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Flash overlay */}
      <div
        id="flash-overlay"
        className="fixed inset-0 z-[60] bg-white pointer-events-none transition-opacity duration-150"
        style={{ opacity: 0 }}
      />

      {mode === 'camera' && (
        <>
          {/* Top bar */}
          <div className="relative z-10 flex items-center justify-between px-4"
               style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)', minHeight: '56px' }}>
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setFlashEnabled(!flashEnabled)}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
            >
              {flashEnabled ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5" />}
            </button>
          </div>

          {/* Camera viewfinder */}
          <div className="flex-1 relative overflow-hidden">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                <CameraIcon className="w-12 h-12 text-white/30 mb-4" />
                <p className="text-white/70 text-sm">{cameraError}</p>
                <button onClick={() => startCamera()} className="mt-4 btn-primary text-xs">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 viewfinder-grid pointer-events-none" />
              </>
            )}
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 flex items-center justify-around px-8 bg-gradient-to-t from-black/60 to-transparent"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 16px)', paddingTop: '20px' }}>
            {/* Gallery picker */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white
                         active:bg-white/30 transition-colors"
            >
              <ImagePlus className="w-6 h-6" />
            </button>

            {/* Shutter button */}
            <button
              onClick={capture}
              disabled={!!cameraError}
              className="w-[76px] h-[76px] rounded-full border-[4px] border-white flex items-center justify-center
                         active:scale-90 transition-transform duration-100 disabled:opacity-30"
            >
              <div className="w-[62px] h-[62px] rounded-full bg-white" />
            </button>

            {/* Switch camera */}
            <button
              onClick={switchCamera}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white
                         active:bg-white/30 transition-colors"
            >
              <SwitchCamera className="w-6 h-6" />
            </button>
          </div>
        </>
      )}

      {(mode === 'preview' || mode === 'uploading') && capturedImage && (
        <>
          {/* Preview image */}
          <div className="flex-1 relative">
            <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-contain" />
          </div>

          {/* Bottom controls */}
          <div className="relative z-10 flex items-center justify-around px-8 bg-gradient-to-t from-black/80 to-transparent"
               style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 8px) + 16px)', paddingTop: '20px' }}>
            {mode === 'uploading' ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <span className="text-white/80 text-sm font-medium">Uploading…</span>
              </div>
            ) : (
              <>
                <button
                  onClick={retake}
                  className="flex flex-col items-center gap-1 text-white/80"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">Retake</span>
                </button>

                <button
                  onClick={handleUpload}
                  className="flex flex-col items-center gap-1"
                >
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-white">Upload</span>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="flex flex-col items-center gap-1 text-white/80"
                >
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <X className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium">Discard</span>
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <div className="absolute bottom-32 left-4 right-4 bg-red-500/90 backdrop-blur-sm text-white text-sm rounded-xl p-3 text-center animate-slide-up">
              {uploadError}
            </div>
          )}
        </>
      )}

      {mode === 'done' && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center animate-scale-in">
            <Check className="w-10 h-10 text-white" />
          </div>
          <p className="text-white font-medium mt-4 animate-fade-in">Uploaded!</p>
        </div>
      )}
    </div>
  );
}
