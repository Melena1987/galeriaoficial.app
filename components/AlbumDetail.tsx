import React, { useState, useEffect, useCallback } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import Spinner from './Spinner';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Modal from './Modal';
import Lightbox from './Lightbox';
import ShareModal from './ShareModal';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const user = auth.currentUser;

  const fetchPhotos = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = db.collection('photos')
      .where('albumId', '==', album.id)
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
        setPhotos(photosData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching photos: ", error);
        setLoading(false);
      });
    return unsubscribe;
  }, [album.id, user]);

  useEffect(() => {
    const unsubscribe = fetchPhotos();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchPhotos]);

  const handleDeletePhoto = async (photoId: string, photoUrl: string) => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      try {
        // Delete photo from storage
        const photoRef = storage.refFromURL(photoUrl);
        await photoRef.delete();

        // Delete photo document from Firestore
        await db.collection('photos').doc(photoId).delete();
        
        // If it was the cover photo, update the album
        if (album.coverPhotoUrl === photoUrl) {
            const remainingPhotosSnapshot = await db.collection('photos')
              .where('albumId', '==', album.id)
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get();
              
            const newCoverUrl = remainingPhotosSnapshot.empty ? '' : remainingPhotosSnapshot.docs[0].data().url;
            await db.collection('albums').doc(album.id).update({ coverPhotoUrl: newCoverUrl || null });
        }
        
      } catch (error) {
        console.error("Error deleting photo: ", error);
        alert("No se pudo eliminar la foto.");
      }
    }
  };

  const handlePhotosAdded = () => {
    setIsUploadModalOpen(false);
    // The onSnapshot listener will automatically update the photos list
  };

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

  return (
    <div className="container p-4 mx-auto md:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
        <div>
          <button onClick={onBack} className="flex items-center mb-2 text-sm text-indigo-400 hover:text-indigo-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Mis Álbumes
          </button>
          <h2 className="text-3xl font-bold">{album.name}</h2>
          <p className="mt-1 text-gray-400">{album.description}</p>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-green-600 rounded-md shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-gray-900"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>
              Compartir
            </button>
            <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center px-4 py-2 font-medium text-white transition-colors bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Añadir Fotos
            </button>
        </div>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={`Añadir fotos a "${album.name}"`}
      >
        <UploadForm album={album} onAlbumCreated={handlePhotosAdded} />
      </Modal>

      <ShareModal
        albumId={album.id}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {photos.map((photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onView={() => setLightboxIndex(index)}
                  onDelete={handleDeletePhoto}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-gray-500 border-2 border-dashed rounded-lg border-gray-700">
              <p className="text-lg">Este álbum está vacío.</p>
              <p className="mt-2">¡Sube algunas fotos para empezar!</p>
               <button
                 onClick={() => setIsUploadModalOpen(true)}
                 className="px-4 py-2 mt-4 font-medium text-white transition-colors bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900"
               >
                 Añadir Fotos
               </button>
            </div>
          )}
        </>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={handleNextLightbox}
          onPrev={handlePrevLightbox}
        />
      )}
    </div>
  );
};

export default AlbumDetail;
