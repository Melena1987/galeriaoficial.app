import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { Album } from '../types';
import Header from './Header';
import UploadForm from './UploadForm';
import AlbumCard from './AlbumCard';
import AlbumDetail from './AlbumDetail';
import Spinner from './Spinner';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const user = auth.currentUser;

  const fetchAlbums = () => {
    if (user) {
      setLoading(true);
      const unsubscribe = db.collection('albums')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
          const fetchedAlbums = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Album));
          setAlbums(fetchedAlbums);
          setLoading(false);
        }, error => {
          console.error("Error fetching albums:", error);
          setLoading(false);
        });
      return unsubscribe;
    }
  };

  useEffect(() => {
    const unsubscribe = fetchAlbums();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleAlbumCreated = () => {
    // Rely on onSnapshot to update the album list.
    console.log("Album created, list will update via snapshot.");
  };
  
  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleBackToGallery = () => {
    setSelectedAlbum(null);
  };

  if (selectedAlbum) {
    return (
      <>
        <Header />
        <AlbumDetail album={selectedAlbum} onBack={handleBackToGallery} />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container p-4 mx-auto md:px-6 lg:px-8">
        <UploadForm onAlbumCreated={handleAlbumCreated} />
        <div className="pt-8 mt-8 border-t border-gray-700">
          <h2 className="mb-6 text-2xl font-bold text-white">Mis Álbumes</h2>
          {loading ? (
            <div className="flex justify-center">
              <Spinner />
            </div>
          ) : albums.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {albums.map(album => (
                <AlbumCard key={album.id} album={album} onSelect={() => handleSelectAlbum(album)} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400">No tienes álbumes todavía. ¡Crea uno nuevo!</p>
          )}
        </div>
      </main>
    </>
  );
};

export default Gallery;
