import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../services/firebase';
import { Album, Photo } from '../types';
import Header from './Header';
import AlbumCard from './AlbumCard';
import Modal from './Modal';
import Spinner from './Spinner';
import AlbumDetail from './AlbumDetail';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Admin sees their albums, others see nothing unless you change this query
    const query = isAdmin 
      ? db.collection('albums').where('userId', '==', user.uid)
      : db.collection('albums').where('userId', '==', 'non-existent-user'); // Effectively shows no albums to non-admins

    const unsubscribe = query
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const userAlbums: Album[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Album));
        setAlbums(userAlbums);
        setLoading(false);
      }, err => {
        console.error("Error fetching albums: ", err);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [user, isAdmin]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim() || !user) return;
    
    await db.collection('albums').add({
      name: newAlbumName,
      description: newAlbumDescription,
      userId: user.uid,
      createdAt: new Date(),
      isPublic: false,
    });

    setNewAlbumName('');
    setNewAlbumDescription('');
    setCreateModalOpen(false);
  };
  
  const handleDeleteAlbum = async (album: Album) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el álbum "${album.name}" y todas sus fotos? Esta acción no se puede deshacer.`)) return;

    try {
      // 1. Get all photos in the album
      const photosSnapshot = await db.collection('photos').where('albumId', '==', album.id).get();
      const photosToDelete = photosSnapshot.docs.map(doc => doc.data() as Photo);
      
      // 2. Delete all photo files from Storage
      const deletePromises = photosToDelete.map(photo => storage.refFromURL(photo.url).delete());
      await Promise.all(deletePromises);

      // 3. Delete all photo documents from Firestore (in a batch)
      const batch = db.batch();
      photosSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // 4. Delete the album document
      await db.collection('albums').doc(album.id).delete();
      
    } catch (error) {
      console.error("Error deleting album:", error);
      alert("No se pudo eliminar el álbum.");
    }
  };


  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleBackToGallery = () => {
    setSelectedAlbum(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (selectedAlbum) {
    return <AlbumDetail album={selectedAlbum} onBack={handleBackToGallery} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="container p-4 mx-auto md:p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Mis Álbumes</h1>
          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 font-semibold text-white transition-colors rounded-lg bg-violet-600 hover:bg-violet-500"
            >
              + Crear Nuevo Álbum
            </button>
          )}
        </div>
        
        {albums.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>
              {isAdmin 
                ? "No tienes álbumes todavía. ¡Crea uno nuevo!" 
                : "No hay álbumes para mostrar."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {albums.map(album => (
              <AlbumCard 
                key={album.id} 
                album={album} 
                onClick={() => handleAlbumClick(album)} 
                onDelete={() => handleDeleteAlbum(album)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>

      {isAdmin && (
        <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Nuevo Álbum">
          <form onSubmit={handleCreateAlbum}>
            {/* Form content remains the same */}
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Gallery;