import React, { useEffect, FC } from 'react';
import { Photo } from '../types';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  if (currentIndex < 0 || currentIndex >= photos.length) {
    return null;
  }

  const currentPhoto = photos[currentIndex];

  const handleDownload = () => {
    // This method creates a temporary link to trigger the browser's download functionality.
    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = currentPhoto.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={onClose}>
      <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="text-white transition-colors hover:text-gray-300"
              aria-label="Descargar"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-white transition-colors hover:text-gray-300"
              aria-label="Cerrar"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>


        {/* Previous Button */}
        {photos.length > 1 && (
            <button
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Anterior"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
        )}

        {/* Next Button */}
        {photos.length > 1 && (
            <button
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-all"
                aria-label="Siguiente"
            >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        )}

        {/* Image and Counter */}
        <div className="flex flex-col items-center justify-center">
            <img
                src={currentPhoto.url}
                alt={currentPhoto.fileName}
                className="max-w-full max-h-[85vh] object-contain"
            />
             <p className="mt-4 text-gray-400 text-sm">{currentIndex + 1} / {photos.length}</p>
        </div>
      </div>
    </div>
  );
};

export default Lightbox;