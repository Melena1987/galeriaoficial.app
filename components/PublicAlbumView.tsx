import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Album, Photo } from '../types';
import Lightbox from './Lightbox';
import Spinner from './Spinner';

interface PublicAlbumViewProps {
  albumId: string;
}

const PublicAlbumView: React.FC<PublicAlbumViewProps> = ({ albumId }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const generateThumbnailUrl = (url: string | undefined): string => {
    if (!url) return '';
    try {
      const urlParts = url.split('?');
      const baseUrl = urlParts[0];
      const queryString = urlParts.length > 1 ? `?${urlParts[1]}` : '';
      // This regex finds the last dot and captures the extension.
      // It inserts '_400x400' before the extension.
      const thumbnailBaseUrl = baseUrl.replace(/(\.[^./\\]+)$/, '_400x400$1');
      // If no replacement happened (e.g., no extension), return original.
      if (thumbnailBaseUrl === baseUrl) {
        return url;
      }
      return thumbnailBaseUrl + queryString;
    } catch (e) {
      console.error("Error generating thumbnail URL:", e);
      return url; // Fallback to original URL on error
    }
  };

  useEffect(() => {
    const fetchAlbumAndPhotos = async () => {
      setLoading(true);
      setError(null);
      try {
        const albumRef = db.collection('albums').doc(albumId);
        const albumDoc = await albumRef.get();

        if (!albumDoc.exists) {
          setError('Álbum no encontrado.');
          setLoading(false);
          return;
        }

        const albumData = { id: albumDoc.id, ...albumDoc.data() } as Album;

        if (!albumData.isPublic) {
          setError('Este álbum no es público.');
          setLoading(false);
          return;
        }

        setAlbum(albumData);

        const photosSnapshot = await db.collection('photos')
          .where('albumId', '==', albumId)
          .orderBy('createdAt', 'desc')
          .get();

        const albumPhotos: Photo[] = photosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Photo));
        
        setPhotos(albumPhotos);
      } catch (e) {
        console.error("Error fetching public album:", e);
        setError('No se pudo cargar el álbum.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumAndPhotos();
  }, [albumId]);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + photos.length) % photos.length));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mt-2 text-lg">{error}</p>
        <a href="/" className="px-4 py-2 mt-4 font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700">
          Volver a la página principal
        </a>
      </div>
    );
  }

  if (!album) return null; // Should be handled by loading/error states

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">{album.name}</h1>
          <p className="text-gray-400">{album.description}</p>
        </div>
      </header>
      <main className="container p-4 mx-auto md:p-6">
        {photos.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p>Este álbum está vacío.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <div 
                key={photo.id} 
                className="relative overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg cursor-pointer aspect-square hover:scale-105"
                onClick={() => openLightbox(index)}
              >
                <img src={generateThumbnailUrl(photo.url)} alt={photo.fileName} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}
      </main>
      
      {lightboxIndex !== null && (
        <Lightbox 
          photos={photos} 
          currentIndex={lightboxIndex} 
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
        />
      )}
    </div>
  );
};

export default PublicAlbumView;