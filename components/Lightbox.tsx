import React, { useEffect, FC, useState, useRef } from 'react';
import { Photo } from '../types';
import Spinner from './Spinner';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  albumName?: string;
}

const Lightbox: FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev, albumName }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef<number | null>(null);
  
  // State for swipe gestures
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const currentPhoto = photos[currentIndex];
  
  const triggerToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    setShowToast(true);
    toastTimeoutRef.current = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Show instruction toast when Lightbox opens
  useEffect(() => {
    triggerToast('Mantén pulsado para guardar');
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [onClose, onNext, onPrev]);


  useEffect(() => {
    if (!currentPhoto) return;
    
    const isVideo = currentPhoto.type === 'video' || currentPhoto.mimeType?.startsWith('video/') || false;

    if (isVideo) {
      setImageStatus('loaded');
      return;
    }

    setImageStatus('loading');
    const img = new Image();
    img.src = currentPhoto.url;
    img.onload = () => setImageStatus('loaded');
    img.onerror = () => setImageStatus('error');
    
    // Preload neighbors
    const nextPhoto = photos[(currentIndex + 1) % photos.length];
    const prevPhoto = photos[(currentIndex - 1 + photos.length) % photos.length];
    
    const preload = (p: Photo) => {
      const pIsVideo = p.type === 'video' || p.mimeType?.startsWith('video/') || false;
      if (!pIsVideo) {
        new Image().src = p.url;
      }
    };

    if (nextPhoto) preload(nextPhoto);
    if (prevPhoto) preload(prevPhoto);
  }, [currentIndex, photos, currentPhoto]);

  if (!currentPhoto) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => setTouchEndX(e.targetTouches[0].clientX);

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) onNext();
    else if (distance < -50) onPrev();
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const navigate = (e: React.MouseEvent, direction: 'next' | 'prev') => {
      e.stopPropagation();
      if (direction === 'next') onNext();
      else onPrev();
  };

  const isVideo = currentPhoto.type === 'video' || currentPhoto.mimeType?.startsWith('video/') || false;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Viewer"
    >
      <div className="absolute top-0 right-0 z-20 flex items-center gap-4 p-4 text-white">
        <button onClick={onClose} className="p-2 transition-transform rounded-full hover:bg-white/10 hover:scale-110" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div 
        className="relative flex items-center justify-center w-full h-full max-h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => navigate(e, 'prev')}
          className="absolute left-0 z-20 p-3 m-2 text-white transition-opacity bg-black rounded-full top-1/2 -translate-y-1/2 bg-opacity-40 hover:bg-opacity-60"
          aria-label="Anterior"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div key={currentIndex} className="relative flex items-center justify-center w-full h-full">
          {imageStatus === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>}
          {imageStatus === 'error' && (
             <div className="text-center text-rose-400">
                <p>Error al cargar el archivo.</p>
                <p className='text-sm text-slate-400'>{currentPhoto.fileName}</p>
             </div>
          )}
          
          {isVideo ? (
            <video
              src={currentPhoto.url}
              controls
              autoPlay
              playsInline
              className="block object-contain w-auto h-auto max-w-full max-h-full shadow-2xl"
              draggable="false"
              onContextMenu={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={currentPhoto.url}
              alt={currentPhoto.fileName}
              className={`
                block object-contain w-auto h-auto max-w-full max-h-full transition-opacity duration-300
                ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}
              `}
              style={{ animation: imageStatus === 'loaded' ? 'fadeIn 0.3s ease-in-out' : 'none' }}
              draggable="false"
              onContextMenu={(e) => e.stopPropagation()} 
            />
          )}
        </div>

        <button
          onClick={(e) => navigate(e, 'next')}
          className="absolute right-0 z-20 p-3 m-2 text-white transition-opacity bg-black rounded-full top-1/2 -translate-y-1/2 bg-opacity-40 hover:bg-opacity-60"
          aria-label="Siguiente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className={`
          absolute left-1/2 -translate-x-1/2 bottom-16 z-30
          px-4 py-2 text-sm text-white rounded-lg shadow-lg
          bg-slate-800/90 ring-1 ring-white/10
          transition-all duration-300 ease-in-out
          ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}>
          {toastMessage}
      </div>

      <div className="absolute bottom-0 z-20 px-3 py-1 m-4 text-sm text-white bg-black rounded-md bg-opacity-50">
           {currentIndex + 1} / {photos.length}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Lightbox;