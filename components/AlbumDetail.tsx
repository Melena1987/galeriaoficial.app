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
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = db.collection('photos')
      .where('albumId', '==', album.id)
      .where('userId', '==', user.uid)
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
  }, [album.id, user]);
  
  const handleToggleSelect = (photoId: string) => {
    setSelectedPhotos(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId) 
        : [...prev, photoId]
    );
  };

  const handleDeleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar ${selectedPhotos.length} foto(s)? Esta acción no se puede deshacer.`)) return;
    
    try {
      const photosToDelete = photos.filter(p => selectedPhotos.includes(p.id));
      
      for (const photo of photosToDelete) {
        try {
          const photoRef = storage.refFromURL(photo.url);
          await photoRef.delete();
        } catch (storageError: any) {
          if (storageError.code !== 'storage/object-not-found') {
            console.error("Error deleting photo from storage:", storageError);
          }
        }
      }

      const batch = db.batch();
      selectedPhotos.forEach(id => {
        batch.delete(db.collection('photos').doc(id));
      });
      await batch.commit();

      const deletedCoverPhoto = photosToDelete.find(p => p.url === album.coverPhotoUrl);
      if (deletedCoverPhoto) {
        const remainingPhotosQuery = await db.collection('photos')
          .where('albumId', '==', album.id)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        
        const newCoverUrl = remainingPhotosQuery.docs.length > 0 ? remainingPhotosQuery.docs[0].data().url : '';
        await db.collection('albums').doc(album.id).update({ coverPhotoUrl: newCoverUrl });
      }

      setSelectedPhotos([]);

    } catch (error) {
      console.error("Error deleting selected photos:", error);
      alert("No se pudieron eliminar las fotos.");
    }
  };


  const handleDeletePhoto = async (photo: Photo) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta foto?")) return;
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
      alert("Error al eliminar la foto.");
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % photos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + photos.length) % photos.length));
  
  const isSelectionMode = isAdmin && selectedPhotos.length > 0;

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

        {isSelectionMode && (
          <div className="sticky top-[65px] z-10 flex items-center justify-between gap-4 p-3 mb-6 -mt-2 rounded-lg bg-slate-800/90 backdrop-blur-sm ring-1 ring-white/10">
            <span className="font-semibold">{selectedPhotos.length} foto(s) seleccionada(s)</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedPhotos([])}
                className="px-3 py-1.5 text-sm font-semibold transition-colors bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
              >
                Limpiar
              </button>
              <button 
                onClick={handleDeleteSelectedPhotos}
                className="px-3 py-1.5 text-sm font-semibold text-white transition-colors bg-rose-600 rounded-md hover:bg-rose-500"
              >
                Eliminar Selección
              </button>
            </div>
          </div>
        )}
        
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
                onClick={() => isSelectionMode ? handleToggleSelect(photo.id) : openLightbox(index)}
                onDelete={() => handleDeletePhoto(photo)}
                isAdmin={isAdmin}
                isSelected={selectedPhotos.includes(photo.id)}
                onSelectToggle={() => handleToggleSelect(photo.id)}
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