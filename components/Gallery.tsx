import React, { useState, useEffect, useCallback } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import Header from './Header';
import AlbumCard from './AlbumCard';
import AlbumDetail from './AlbumDetail';
import UploadForm from './UploadForm';
import Spinner from './Spinner';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const user = auth.currentUser;

  const fetchAlbums = useCallback(() => {
    if (!user) return;
    setLoading(true);
    const unsubscribe = db.collection('albums')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const albumsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Album));
        setAlbums(albumsData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching albums: ", error);
        setLoading(false);
      });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    const unsubscribe = fetchAlbums();
    return () => {
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [fetchAlbums]);

  const handleDeleteAlbum = async (albumId: string) => {
    if (!user) return;
    if (window.confirm("¿Estás seguro de que quieres eliminar este álbum y todas sus fotos? Esta acción no se puede deshacer.")) {
      try {
        // Find all photos in the album
        const photosSnapshot = await db.collection('photos').where('albumId', '==', albumId).where('userId', '==', user.uid).get();
        const batch = db.batch();
        
        const deleteStoragePromises: Promise<void>[] = [];

        photosSnapshot.forEach(doc => {
          const photo = doc.data() as Photo;
          // Delete photo from storage by URL
          if (photo.url) {
            try {
                const photoRef = storage.refFromURL(photo.url);
                deleteStoragePromises.push(photoRef.delete());
            } catch (e) {
                console.warn("Could not delete photo from storage, maybe it was already deleted:", photo.url, e)
            }
          }
          // Delete photo doc from firestore
          batch.delete(doc.ref);
        });

        // Delete album doc from firestore
        const albumRef = db.collection('albums').doc(albumId);
        batch.delete(albumRef);

        await Promise.all(deleteStoragePromises);
        await batch.commit();

        if (selectedAlbumId === albumId) {
          setSelectedAlbumId(null);
        }

      } catch (error) {
        console.error("Error deleting album: ", error);
        alert("No se pudo eliminar el álbum.");
      }
    }
  };
  
  const handleAlbumCreated = () => {
    // onSnapshot will handle the update, so this can be empty or used for other side-effects.
  }

  const selectedAlbum = albums.find(album => album.id === selectedAlbumId);

  return (
    <>
      <Header />
      <main className="min-h-screen text-white bg-gray-900">
        {selectedAlbum ? (
          <AlbumDetail album={selectedAlbum} onBack={() => setSelectedAlbumId(null)} />
        ) : (
          <div className="container p-4 mx-auto md:p-6 lg:p-8">
            <div className="mb-8">
              <UploadForm onAlbumCreated={handleAlbumCreated} />
            </div>
            <h2 className="mb-6 text-2xl font-bold">Mis Álbumes</h2>
            {loading ? (
              <div className="flex justify-center py-10">
                <Spinner />
              </div>
            ) : (
                <>
                    {albums.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {albums.map(album => (
                                <AlbumCard 
                                    key={album.id} 
                                    album={album} 
                                    onSelectAlbum={setSelectedAlbumId}
                                    onDeleteAlbum={handleDeleteAlbum}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-500">
                            <p>Aún no tienes álbumes.</p>
                            <p>¡Crea uno para empezar!</p>
                        </div>
                    )}
                </>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default Gallery;
