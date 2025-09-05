import React, { useState, useEffect, useCallback } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import PhotoCard from './PhotoCard';
import UploadForm from './UploadForm';
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
      .where('userId', '==', user.uid)
      .where('albumId', '==', album.id)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const photosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Photo));
        setPhotos(photosData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching photos:", error);
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
    if (window.confirm("¿Estás seguro de que quieres eliminar esta foto?")) {
      try {
        const photoDoc = await db.collection('photos').doc(photoId).get();
        if (!photoDoc.exists) {
            console.error("Photo document does not exist.");
            alert("No se pudo encontrar la foto para eliminarla.");
            return;
        }
        const photoData = photoDoc.data() as Photo;
        
        // Delete from Storage using the URL
        const storageRef = storage.refFromURL(photoData.url);
        await storageRef.delete();
        
        // Delete from Firestore
        await db.collection('photos').doc(photoId).delete();
        
      } catch (error) {
        console.error("Error deleting photo: ", error);
        alert("No se pudo eliminar la foto.");
      }
    }
  };

  return (
    <div className="container p-4 mx-auto md:p-6 lg:p-8">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300">
        &larr; Volver a los Álbumes
      </button>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">{album.name}</h2>
        <p className="mt-1 text-gray-400">{album.description}</p>
      </div>

      <div className="mb-8">
        <UploadForm album={album} onAlbumCreated={() => { /* onSnapshot will handle update */ }} />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <>
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {photos.map(photo => (
                <PhotoCard key={photo.id} photo={photo} onDelete={handleDeletePhoto} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500">
              <p>Este álbum aún no tiene fotos.</p>
              <p>¡Sube la primera!</p>
            </div>
          )}
        </>
       )}
    </div>
  );
};

export default AlbumDetail;
