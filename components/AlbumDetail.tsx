import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Album, Photo } from '../types';
import PhotoCard from './PhotoCard';
import Spinner from './Spinner';
import UploadForm from './UploadForm';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album, onBack }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = db.collection('photos')
      .where('albumId', '==', album.id)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const fetchedPhotos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Photo));
        setPhotos(fetchedPhotos);
        setLoading(false);
      }, error => {
        console.error("Error fetching photos:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [album.id]);
  
  const handlePhotoAdded = () => {
    // Rely on onSnapshot to update photo list
    console.log("Photo added, list will update via snapshot.");
  };

  return (
    <main className="container p-4 mx-auto md:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-white transition-colors hover:text-indigo-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
            <h2 className="text-3xl font-bold text-white">{album.name}</h2>
            <p className="mt-1 text-gray-400">{album.description}</p>
        </div>
      </div>
      
      <div className="mb-8">
        <UploadForm onAlbumCreated={handlePhotoAdded} album={album} />
      </div>

      <div className="pt-8 border-t border-gray-700">
        <h3 className="mb-6 text-2xl font-bold text-white">Fotos</h3>
        {loading ? (
          <div className="flex justify-center">
            <Spinner />
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {photos.map(photo => (
              <PhotoCard key={photo.id} photo={photo} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">Este álbum no tiene fotos todavía. ¡Sube algunas!</p>
        )}
      </div>
    </main>
  );
};

export default AlbumDetail;
