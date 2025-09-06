import React, { useEffect, FC, useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

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

  if (currentIndex === null || !photos[currentIndex]) return null;

  const currentPhoto = photos[currentIndex];
  
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
    if (isProcessing) return;
    setIsProcessing(true);
    
    const fileName = currentPhoto.fileName || `photo-${currentPhoto.id}.jpg`;
    
    try {
      // IDEAL PATH: Fetch the image data to allow true file sharing or a named download.
      // This will only work if CORS is correctly configured on the storage bucket.
      const response = await fetch(currentPhoto.url);
      if (!response.ok) throw new Error('Network response was not ok, likely a CORS issue.');
      const blob = await response.blob();
      
      const file = new File([blob], fileName, { type: blob.type });

      // Mobile / Modern browsers with Web Share API for files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: albumName ? `Foto del álbum ${albumName}` : `Foto compartida desde la galería.`,
        });
      } else {
        // Desktop / Fallback for browsers without file sharing
        triggerDownload(blob, fileName);
      }

    } catch (error) {
      console.warn('Ideal share/download path failed, falling back to simpler methods.', error);

      // FALLBACK PATH: If fetch fails (e.g., CORS error), use URL-based methods.
      try {
        // Mobile fallback: Share the direct URL to the image.
        if (navigator.share) {
          await navigator.share({
            title: albumName ? `Foto de ${albumName}` : 'Mira esta foto',
            text: albumName ? `Te comparto esta foto del álbum "${albumName}"` : 'Te comparto esta foto:',
            url: currentPhoto.url, // Corrected: Share the photo URL, not the page URL.
          });
        } else {
          // Desktop fallback: Open the image in a new tab. The user can save it from there.
          // Direct download with a custom name is not possible cross-origin without CORS.
          window.open(currentPhoto.url, '_blank', 'noopener,noreferrer');
        }
      } catch (fallbackError: any) {
        // Do not show an error if the user simply closes the share dialog.
        if (fallbackError.name !== 'AbortError') {
          console.error('Fallback share/open failed:', fallbackError);
          // Only show alert if the very last resort fails.
          alert('No se pudo compartir o descargar la imagen.');
        }
      }
    } finally {
      setIsProcessing(false);
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
    
    // Reset for the next interaction
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
          disabled={isProcessing}
          className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
          aria-label="Compartir o descargar imagen"
        >
          {isProcessing ? <Spinner className="w-6 h-6 border-2" /> : (
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
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.fileName}
          className="object-contain max-w-full max-h-full"
          style={{
            transform: `translateX(${touchDeltaX}px)`,
            transition: touchStartX === null ? 'transform 0.2s ease-out' : 'none',
          }}
          draggable="false"
        />
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