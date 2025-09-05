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
    const fetchAlbumAndPhotos = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch album details
        const albumDoc = await db.collection('albums').doc(albumId).get();
        if (!albumDoc.exists) {
          throw new Error("Álbum no encontrado o no es público.");
        }
        setAlbum({ id: albumDoc.id, ...albumDoc.data() } as Album);

        // Fetch photos for the album
        const photosSnapshot = await db.collection('photos')
          .where('albumId', '==', albumId)
          .orderBy('createdAt', 'desc')
          .get();
        
        const photosData = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
        setPhotos(photosData);

      } catch (err: any) {
        console.error("Error fetching public album:", err);
        setError(err.message || "No se pudo cargar el álbum.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumAndPhotos();
  }, [albumId]);
  
  const handleNextLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % photos.length);
    }
  };

  const handlePrevLightbox = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center text-red-400 bg-gray-900">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-10 w-full bg-gray-800/80 backdrop-blur-sm shadow-md">
        <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6 lg:px-8">
          <h1 className="text-xl font-bold tracking-wider text-white uppercase">
            GaleríaOficial.app by Manu
          </h1>
        </div>
      </header>
      <main className="min-h-screen text-white bg-gray-900">
          <div className="container p-4 mx-auto md:p-6 lg:p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold">{album?.name}</h2>
              <p className="mt-1 text-gray-400">{album?.description}</p>
            </div>

            {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {photos.map((photo, index) => (
                        <div key={photo.id} className="overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg group aspect-w-1 aspect-h-1" onClick={() => setLightboxIndex(index)}>
                            <img src={photo.url} alt={photo.fileName} className="object-cover w-full h-full cursor-pointer" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center text-gray-500 border-2 border-dashed rounded-lg border-gray-700">
                    <p className="text-lg">Este álbum no tiene fotos.</p>
                </div>
            )}
          </div>
      </main>
      
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={handleNextLightbox}
          onPrev={handlePrevLightbox}
        />
      )}
    </>
  );
};

export default PublicAlbumView;
