import React, { useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import { Album } from '../types';
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

  useEffect(() => {
    if (!user) return;
    const unsubscribe = db.collection('albums')
      .where('userId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const userAlbums: Album[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Album));
        setAlbums(userAlbums);
        setLoading(false);
      });
    return () => unsubscribe();
  }, [user]);

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

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
  };

  const handleBackToGallery = () => {
    setSelectedAlbum(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  if (selectedAlbum) {
    return <AlbumDetail album={selectedAlbum} onBack={handleBackToGallery} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="container p-4 mx-auto md:p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mis Álbumes</h1>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Crear Álbum
          </button>
        </div>
        
        {albums.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p>No tienes álbumes todavía.</p>
            <p>¡Crea tu primer álbum para empezar a subir fotos!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {albums.map(album => (
              <AlbumCard key={album.id} album={album} onClick={() => handleAlbumClick(album)} />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Nuevo Álbum">
        <form onSubmit={handleCreateAlbum}>
          <div className="mb-4">
            <label htmlFor="albumName" className="block mb-2 text-sm font-medium text-gray-300">Nombre del Álbum</label>
            <input
              type="text"
              id="albumName"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="albumDescription" className="block mb-2 text-sm font-medium text-gray-300">Descripción (Opcional)</label>
            <textarea
              id="albumDescription"
              value={newAlbumDescription}
              onChange={(e) => setNewAlbumDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 font-semibold text-gray-300 transition-colors bg-gray-600 rounded-md hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Gallery;
