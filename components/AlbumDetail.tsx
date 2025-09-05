import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Spinner from './Spinner';
import Lightbox from './Lightbox';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    setLoading(true);
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
      }, (error) => {
        console.error("Error fetching photos: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [album.id]);

  const handleDeletePhoto = async (photo: Photo) => {
    if (!window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) return;

    try {
      // Delete from Firestore
      await db.collection('photos').doc(photo.id).delete();
      
      // Delete from Storage
      const photoRef = storage.refFromURL(photo.url);
      await photoRef.delete();

      // Check if this was the cover photo
      const albumRef = db.collection('albums').doc(album.id);
      const albumDoc = await albumRef.get();
      if (albumDoc.exists && albumDoc.data()?.coverPhotoUrl === photo.url) {
        // If there are other photos, set the newest one as cover. Otherwise, remove cover.
        const remainingPhotosQuery = db.collection('photos')
          .where('albumId', '==', album.id)
          .orderBy('createdAt', 'desc')
          .limit(1);
        const remainingPhotosSnapshot = await remainingPhotosQuery.get();
        
        let newCoverUrl = '';
        if (!remainingPhotosSnapshot.empty) {
          newCoverUrl = remainingPhotosSnapshot.docs[0].data().url;
        }
        await albumRef.update({ coverPhotoUrl: newCoverUrl });
      }

    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo.");
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + photos.length) % photos.length));

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="sticky top-0 z-30 flex items-center h-16 bg-slate-900/75 backdrop-blur-lg ring-1 ring-white/10">
        <div className="container flex items-center gap-4 px-4 mx-auto md:px-6">
          <button onClick={onBack} className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Volver a álbumes">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold">{album.name}</h1>
            <p className="text-sm text-slate-400">{album.description}</p>
          </div>
        </div>
      </header>

      <main className="container p-4 mx-auto md:p-6">
        {isAdmin && <UploadForm albumId={album.id} />}
        
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : photos.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>Este álbum está vacío.</p>
            {isAdmin && <p>¡Sube tu primera foto para empezar!</p>}
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
    </div>
  );
};

export default AlbumDetail;
