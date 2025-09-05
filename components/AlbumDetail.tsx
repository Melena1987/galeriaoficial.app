
import React, { useState, useEffect, useCallback } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Spinner from './Spinner';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
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

  const handleDeletePhoto = async (photoId: string, fileName: string) => {
    if (!user) return;
    if (window.confirm(`¿Estás seguro de que quieres eliminar la foto "${fileName}"?`)) {
      try {
        const photoRef = db.collection('photos').doc(photoId);
        const photoDoc = await photoRef.get();
        if (!photoDoc.exists) {
            console.error("Photo does not exist");
            return;
        }
        const photoData = photoDoc.data() as Photo;
        
        // Delete from storage
        if (photoData.url) {
            const storageRef = storage.refFromURL(photoData.url);
            await storageRef.delete();
        }

        // Delete from firestore
        await photoRef.delete();

        // Check if this was the cover photo
        if (album.coverPhotoUrl === photoData.url) {
            // Find a new cover photo (the most recent one)
            const newCoverSnapshot = await db.collection('photos')
                .where('albumId', '==', album.id)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            const newCoverUrl = newCoverSnapshot.empty ? null : (newCoverSnapshot.docs[0].data() as Photo).url;

            await db.collection('albums').doc(album.id).update({
                coverPhotoUrl: newCoverUrl
            });
        }

      } catch (error) {
        console.error("Error deleting photo: ", error);
        alert("No se pudo eliminar la foto.");
      }
    }
  };
  
  const handlePhotoAdded = () => {
    // onSnapshot will handle the update, so this can be empty or used for other side-effects.
  };

  return (
    <div className="container p-4 mx-auto md:p-6 lg:p-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-white hover:text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold">{album.name}</h1>
          {album.description && <p className="mt-1 text-gray-400">{album.description}</p>}
        </div>
      </div>
      
      <div className="mb-8">
        <UploadForm album={album} onAlbumCreated={handlePhotoAdded} />
      </div>

      <h2 className="mb-6 text-2xl font-bold">Fotos</h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {photos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p>Este álbum aún no tiene fotos.</p>
              <p>¡Sube algunas para empezar!</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AlbumDetail;
