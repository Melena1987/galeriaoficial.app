import React, { useEffect, FC, useState } from 'react';
import { Photo } from '../types';
import Spinner from './Spinner';
import { getThumbnailUrl } from '../utils/image';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  albumName?: string;
}

const Lightbox: FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev, albumName }) => {
  const [isFullResLoading, setIsFullResLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    if (!currentPhoto?.url) return;

    setIsFullResLoading(true);
    const img = new Image();
    img.src = currentPhoto.url;
    img.onload = () => setIsFullResLoading(false);
    img.onerror = () => {
      console.error(`Failed to load full-res image: ${currentPhoto.url}`);
      setIsFullResLoading(false);
    };
  }, [currentPhoto]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onNext, onPrev]);

  if (!currentPhoto) return null;

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };
  
  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    
    const fileName = currentPhoto.fileName || `photo-${currentPhoto.id}.jpg`;
    
    try {
      const response = await fetch(currentPhoto.url);
      if (!response.ok) throw new Error('Network response was not ok, likely a CORS issue.');
      const blob = await response.blob();
      
      const file = new File([blob], fileName, { type: blob.type });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: albumName ? `Foto del álbum ${albumName}` : `Foto compartida desde la galería.`,
        });
      } else {
        triggerDownload(blob, fileName);
      }

    } catch (error) {
      console.warn('Ideal share/download path failed, falling back to simpler methods.', error);

      try {
        if (navigator.share) {
          await navigator.share({
            title: albumName ? `Foto de ${albumName}` : 'Mira esta foto',
            text: albumName ? `Te comparto esta foto del álbum "${albumName}"` : 'Te comparto esta foto:',
            url: currentPhoto.url,
          });
        } else {
          window.open(currentPhoto.url, '_blank', 'noopener,noreferrer');
        }
      } catch (fallbackError: any) {
        if (fallbackError.name !== 'AbortError') {
          console.error('Fallback share/open failed:', fallbackError);
          alert('No se pudo compartir o descargar la imagen.');
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    
    const swipeThreshold = 50; // Min distance in pixels to be a swipe
    if (Math.abs(touchDeltaX) > swipeThreshold) {
      if (touchDeltaX < 0) { // Swiped left
        onNext();
      } else { // Swiped right
        onPrev();
      }
    }
    
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
    >
      {/* Top Controls */}
      <div className="absolute z-10 flex items-center gap-4 p-2 text-white transition-opacity bg-black rounded-full top-4 right-4 bg-opacity-40">
        <button
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          disabled={isSharing}
          className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
          aria-label="Compartir o descargar imagen"
        >
          {isSharing ? <Spinner className="w-6 h-6 border-2" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" />
            </svg>
          )}
        </button>
        <button onClick={onClose} className="transition-transform hover:scale-110" aria-label="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Image */}
      <div 
        className="relative flex items-center justify-center w-full h-full" 
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${touchDeltaX}px)`,
          transition: touchStartX === null ? 'transform 0.2s ease-out' : 'none',
        }}
        draggable="false"
      >
        {/* Thumbnail - acts as a blurry placeholder */}
        <img
          src={getThumbnailUrl(currentPhoto.url)}
          alt="" // Decorative, alt text is on the main image
          className="absolute object-contain w-full h-full max-w-full max-h-full transition-opacity duration-300 filter blur-md"
          style={{ opacity: isFullResLoading ? 1 : 0 }}
          draggable="false"
        />

        {/* Full Resolution Image - fades in when loaded */}
        <img
          src={currentPhoto.url}
          alt={currentPhoto.fileName}
          className="relative object-contain max-w-full max-h-full transition-opacity duration-500"
          style={{ opacity: isFullResLoading ? 0 : 1 }}
          draggable="false"
        />

        {/* Loading Spinner */}
        {isFullResLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black bg-opacity-50 text-white text-sm rounded-md">
           {currentIndex + 1} / {photos.length}
        </div>
      </div>

      {/* Prev button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white transition-opacity bg-black rounded-full bg-opacity-40 hover:bg-opacity-60 hidden md:block"
        aria-label="Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Next button */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white transition-opacity bg-black rounded-full bg-opacity-40 hover:bg-opacity-60 hidden md:block"
        aria-label="Siguiente"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Lightbox;
