import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Album, Photo } from '../types';
import Spinner from './Spinner';
import Lightbox from './Lightbox';

interface PublicAlbumViewProps {
  albumId: string;
}

const PublicAlbumView: React.FC<PublicAlbumViewProps> = ({ albumId }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        setError(null);
        const albumRef = db.collection('albums').doc(albumId);
        const albumDoc = await albumRef.get();

        if (!albumDoc.exists || !albumDoc.data()?.isPublic) {
          setError('Este álbum no existe o no es público.');
          setLoading(false);
          return;
        }

        setAlbum({ id: albumDoc.id, ...albumDoc.data() } as Album);

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
        setError('Ocurrió un error al cargar el álbum.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumData();
  }, [albumId]);
  
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + photos.length) % photos.length));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-gray-900">
        <h2 className="mb-4 text-2xl">Error</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="py-4 text-center bg-gray-800">
        <h1 className="text-3xl font-bold">{album?.name}</h1>
        <p className="text-gray-400">{album?.description}</p>
      </header>
      <main className="container p-4 mx-auto md:p-6">
        {photos.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p>Este álbum no tiene fotos todavía.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <div 
                key={photo.id}
                className="overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg cursor-pointer aspect-square hover:scale-105"
                onClick={() => openLightbox(index)}
              >
                 <img src={photo.url} alt={photo.fileName} className="object-cover w-full h-full" />
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
