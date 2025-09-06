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

const Lightbox: FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [imageQualities, setImageQualities] = useState<Record<string, 'high' | 'low'>>({});

  const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
  const nextIndex = (currentIndex + 1) % photos.length;

  const currentPhoto = photos[currentIndex];
  const prevPhoto = photos[prevIndex];
  const nextPhoto = photos[nextIndex];

  const hasHighQuality = (photo?: Photo) => photo && imageQualities[photo.id] === 'high';

  const preloadImage = (photo: Photo) => {
    if (!photo || imageQualities[photo.id]) return;
    const img = new Image();
    img.src = photo.url;
    img.onload = () => {
      setImageQualities(prev => ({ ...prev, [photo.id]: 'high' }));
    };
  };

  useEffect(() => {
    preloadImage(currentPhoto);
    preloadImage(nextPhoto);
    preloadImage(prevPhoto);
  }, [currentIndex, photos]);
  
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
    };
  }, [onClose, onNext, onPrev]);

  if (!currentPhoto) return null;

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    const { url, fileName } = currentPhoto;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download failed:', error);
      alert('No se pudo iniciar la descarga directa. Se abrirá la imagen en una nueva pestaña para que puedas guardarla manualmente.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsSharing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    setIsSwiping(false);
    const swipeThreshold = window.innerWidth / 4;

    if (touchDeltaX < -swipeThreshold) {
      onNext();
    } else if (touchDeltaX > swipeThreshold) {
      onPrev();
    } else {
      setTouchDeltaX(0);
    }
    setTouchStartX(null);
  };

  const handleTransitionEnd = () => {
      // After a transition to a new image, reset the delta.
      if (touchDeltaX !== 0) {
          setTouchDeltaX(0);
      }
  };

  const filmstripStyle: React.CSSProperties = {
    display: 'flex',
    transform: `translateX(calc(-100% + ${touchDeltaX}px))`,
    transition: isSwiping ? 'none' : 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
  };

  const ImageComponent = ({ photo }: { photo?: Photo }) => {
    if (!photo) return <div className="relative flex-shrink-0 w-full h-full" />;
    return (
      <div className="relative flex-shrink-0 w-full h-full" draggable="false">
        <img
          src={photo.url}
          alt={photo.fileName}
          className="object-contain w-full h-full max-w-full max-h-full"
          style={{
            opacity: hasHighQuality(photo) ? 1 : 0,
            transition: 'opacity 0.5s',
          }}
          draggable="false"
        />
        {!hasHighQuality(photo) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-90"
      onClick={onClose}
    >
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

      <div
        className="relative w-full h-full overflow-hidden"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={filmstripStyle} onTransitionEnd={handleTransitionEnd}>
          <ImageComponent photo={prevPhoto} />
          <ImageComponent photo={currentPhoto} />
          <ImageComponent photo={nextPhoto} />
        </div>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black bg-opacity-50 text-white text-sm rounded-md">
           {currentIndex + 1} / {photos.length}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white transition-opacity bg-black rounded-full bg-opacity-40 hover:bg-opacity-60 hidden md:block"
        aria-label="Anterior"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

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
