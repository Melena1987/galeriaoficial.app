import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Lightbox from './Lightbox';
import Spinner from './Spinner';
import ShareModal from './ShareModal';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  
  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    if (!album) return;
    const unsubscribe = db.collection('photos')
      .where('albumId', '==', album.id)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const albumPhotos: Photo[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Photo));
        setPhotos(albumPhotos);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [album]);

  const handleDeletePhoto = async (photo: Photo) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la foto "${photo.fileName}"?`)) return;

    try {
      const photoRef = storage.refFromURL(photo.url);
      await photoRef.delete();
      await db.collection('photos').doc(photo.id).delete();
      
      const albumRef = db.collection('albums').doc(album.id);
      if (album.coverPhotoUrl === photo.url) {
        const remainingPhotos = photos.filter(p => p.id !== photo.id);
        const newCoverUrl = remainingPhotos.length > 0 ? remainingPhotos[0].url : '';
        await albumRef.update({ coverPhotoUrl: newCoverUrl });
      }

    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("No se pudo eliminar la foto.");
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + photos.length) % photos.length));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <main className="container p-4 mx-auto md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <button onClick={onBack} className="flex items-center gap-2 mb-2 text-violet-400 hover:text-violet-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Mis Álbumes
            </button>
            <h1 className="text-3xl font-bold">{album.name}</h1>
            <p className="text-slate-400">{album.description}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShareModalOpen(true)}
              className="px-4 py-2 font-semibold text-white transition-colors bg-green-600 rounded-md hover:bg-green-700"
            >
              Compartir
            </button>
          )}
        </div>

        {isAdmin && <UploadForm albumId={album.id} />}
        
        {photos.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>Este álbum aún no tiene fotos.</p>
            {isAdmin && <p>¡Sube la primera!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <PhotoCard 
                key={photo.id} 
                photo={photo} 
                onClick={() => openLightbox(index)} 
                onDelete={() => handleDeletePhoto(photo)}
                isAdmin={isAdmin}
              />
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

      {isAdmin && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
          album={album}
        />
      )}
    </div>
  );
};

export default AlbumDetail;