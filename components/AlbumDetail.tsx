import React, { useState, useEffect } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Lightbox from './Lightbox';
import Spinner from './Spinner';

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
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    try {
      // Delete from storage
      const photoRef = storage.refFromURL(photo.url);
      await photoRef.delete();

      // Delete from firestore
      await db.collection('photos').doc(photo.id).delete();
      
      // Check if this was the cover photo
      if (album.coverPhotoUrl === photo.url) {
        // Find the next photo to set as cover
        const remainingPhotosQuery = await db.collection('photos')
          .where('albumId', '==', album.id)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        const newCoverUrl = remainingPhotosQuery.docs.length > 0 ? remainingPhotosQuery.docs[0].data().url : '';
        await db.collection('albums').doc(album.id).update({ coverPhotoUrl: newCoverUrl });
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
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 h-16 bg-slate-900/75 backdrop-blur-lg">
        <div className="container flex items-center h-full mx-auto px-4 md:px-6">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="ml-4">
            <h1 className="text-xl font-bold truncate">{album.name}</h1>
            <p className="text-sm text-slate-400 truncate">{album.description}</p>
          </div>
        </div>
      </header>

      <main className="container p-4 mx-auto md:p-6">
        {isAdmin && <UploadForm albumId={album.id} />}
        
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
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
