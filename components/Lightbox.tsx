import React, { useEffect, FC, useState } from 'react';
import { Photo } from '../types';

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: FC<LightboxProps> = ({ photos, currentIndex, onClose, onNext, onPrev }) => {
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      // Fetch the image from the URL.
      const response = await fetch(currentPhoto.url);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      // Get the image data as a blob.
      const blob = await response.blob();
      
      // Create a temporary URL for the blob.
      const objectUrl = URL.createObjectURL(blob);
      
      // Create a temporary link to trigger the download.
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = currentPhoto.fileName || 'download.jpg'; // Provide a fallback filename.
      document.body.appendChild(link);
      link.click();
      
      // Clean up by removing the link and revoking the object URL.
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('No se pudo descargar la imagen.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90" onClick={onClose}>
      <div className="relative w-full h-full p-4 md:p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        
        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="text-white transition-colors hover:text-gray-300 disabled:opacity-50 disabled:cursor-wait"
              aria-label="Descargar"
            >
              {isDownloading ? (
                <svg className="w-7 h-7 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              )}
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
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 <strong>'24'</strong>" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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