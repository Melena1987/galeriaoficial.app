import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/firebase';
import { Album, Photo } from '../types';
import Lightbox from './Lightbox';
import Spinner from './Spinner';
import LazyImage from './LazyImage';
import { getThumbnailUrl } from '../utils/image';

interface PublicAlbumViewProps {
  albumId: string;
  isEmbedded: boolean;
}

const PublicAlbumView: React.FC<PublicAlbumViewProps> = ({ albumId, isEmbedded }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    // This effect updates the document's head to reflect the current album's details.
    if (album) {
      const defaultTitle = 'GaleríaOficial.app by Manu';
      const newTitle = `${album.name} | GaleríaOficial.app`;
      const description = album.description || `Mira las fotos del álbum "${album.name}".`;
      // Use the full-resolution cover photo for the best preview quality.
      const imageUrl = album.coverPhotoUrl || 'https://images.unsplash.com/photo-1593011033254-2158da848318?q=80&w=1200&h=630&auto=format&fit=crop';
      const currentUrl = window.location.href;

      document.title = newTitle;

      const updateMetaTag = (selector: string, content: string) => {
        const element = document.querySelector(selector) as HTMLMetaElement | null;
        if (element) {
          element.content = content;
        }
      };
      
      updateMetaTag('meta[name="description"]', description);
      updateMetaTag('meta[property="og:title"]', newTitle);
      updateMetaTag('meta[property="og:description"]', description);
      updateMetaTag('meta[property="og:image"]', imageUrl);
      updateMetaTag('meta[property="og:url"]', currentUrl);
      updateMetaTag('meta[property="twitter:title"]', newTitle);
      updateMetaTag('meta[property="twitter:description"]', description);
      updateMetaTag('meta[property="twitter:image"]', imageUrl);
      updateMetaTag('meta[property="twitter:url"]', currentUrl);

      // Cleanup function to reset meta tags when the component unmounts
      return () => {
        document.title = defaultTitle;
        // Resetting to default values from index.html
        updateMetaTag('meta[name="description"]', 'Crea, gestiona y comparte álbumes de fotos con un diseño profesional y minimalista.');
        updateMetaTag('meta[property="og:title"]', 'GaleríaOficial.app by Manu');
        updateMetaTag('meta[property="og:description"]', 'Crea, gestiona y comparte álbumes de fotos con un diseño profesional y minimalista.');
        updateMetaTag('meta[property="og:image"]', 'https://images.unsplash.com/photo-1593011033254-2158da848318?q=80&w=1200&h=630&auto=format&fit=crop');
        updateMetaTag('meta[property="og:url"]', 'https://galeriaoficial.app');
        updateMetaTag('meta[property="twitter:title"]', 'GaleríaOficial.app by Manu');
        updateMetaTag('meta[property="twitter:description"]', 'Crea, gestiona y comparte álbumes de fotos con un diseño profesional y minimalista.');
        updateMetaTag('meta[property="twitter:image"]', 'https://images.unsplash.com/photo-1593011033254-2158da848318?q=80&w=1200&h=630&auto=format&fit=crop');
        updateMetaTag('meta[property="twitter:url"]', 'https://galeriaoficial.app');
      };
    }
  }, [album]);


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

        // Fetch photos without ordering from Firestore to avoid composite index requirement.
        const photosSnapshot = await db.collection('photos')
          .where('albumId', '==', albumId)
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

  // Sort photos on the client-side after they are fetched.
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
  }, [photos]);


  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % sortedPhotos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + sortedPhotos.length) % sortedPhotos.length));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
        <h1 className="text-2xl font-bold text-rose-500">Error</h1>
        <p className="mt-2 text-lg">{error}</p>
        <a href={window.location.origin} className="px-4 py-2 mt-4 font-semibold text-white transition-colors rounded-md bg-violet-600 hover:bg-violet-700">
          Volver a la página principal
        </a>
      </div>
    );
  }

  if (!album) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {!isEmbedded && (
        <header className="p-4 shadow-md bg-slate-900/75 backdrop-blur-lg ring-1 ring-white/10">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold">{album.name}</h1>
            <p className="text-slate-400">{album.description}</p>
          </div>
        </header>
      )}
      <main className={`container mx-auto ${isEmbedded ? 'p-1 sm:p-2' : 'p-4 md:p-6'}`}>
        {sortedPhotos.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>Este álbum está vacío.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 ${isEmbedded ? 'gap-1 sm:gap-2' : 'gap-4'}`}>
            {sortedPhotos.map((photo, index) => {
              const isVideo = photo.type === 'video' || photo.mimeType?.startsWith('video/') || false;
              return (
                <div
                  key={photo.id}
                  className="relative overflow-hidden transition-transform duration-300 transform rounded-lg shadow-lg cursor-pointer group aspect-square bg-slate-800 hover:scale-105"
                  onClick={() => openLightbox(index)}
                >
                  {isVideo ? (
                    <div className="relative w-full h-full">
                       <video 
                          src={`${photo.url}#t=0.5`} 
                          className="object-cover w-full h-full pointer-events-none" 
                          preload="metadata"
                          muted
                          playsInline
                       />
                       <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="p-3 bg-black/40 rounded-full backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <LazyImage
                      src={getThumbnailUrl(photo.url)}
                      alt={photo.fileName}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      
      {lightboxIndex !== null && (
        <Lightbox 
          photos={sortedPhotos} 
          currentIndex={lightboxIndex} 
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
          albumName={album.name}
        />
      )}
    </div>
  );
};

export default PublicAlbumView;