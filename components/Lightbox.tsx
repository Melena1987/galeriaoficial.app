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

  const handleShare = async () => {
    if (isSharing || !currentPhoto) return;
    setIsSharing(true);

    const { url, fileName } = currentPhoto;

    // This is the most robust method to force a download for cross-origin images.
    // It works by fetching the image data, creating a temporary local representation (a "blob"),
    // and then triggering a download for that local data.
    try {
      // 1. Fetch the image data. The server (Firebase Storage) MUST be configured with
      //    CORS headers to allow requests from this web app's origin.
      const response = await fetch(url);

      if (!response.ok) {
        // If the response is not ok (e.g., 404 Not Found, 403 Forbidden), throw an error.
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // 2. Convert the response into a blob (binary large object).
      const blob = await response.blob();

      // 3. Create a temporary, local URL for the blob.
      const blobUrl = window.URL.createObjectURL(blob);

      // 4. Create a hidden link element.
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = fileName; // This attribute tells the browser to download the file.

      // 5. Add the link to the document, click it, and then remove it.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 6. Clean up by revoking the temporary URL to free memory.
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Download failed due to an error:', error);
      // If the fetch failed (likely due to a CORS issue which is very common),
      // the ONLY remaining option is to open the image in a new tab.
      // This allows the user to manually save it. It's the best possible fallback.
      alert('No se pudo iniciar la descarga directa. Se abrirá la imagen en una nueva pestaña para que puedas guardarla manualmente.');
      window.open(url, '_blank', 'noopener,noreferrer');
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
          aria-label="Descargar imagen"
          title="Descargar imagen"
        >
          {isSharing ? <Spinner className="w-6 h-6 border-2" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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