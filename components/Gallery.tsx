// FIX: Re-implement the Gallery component to be a functional React component.
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { Album, Photo } from '../types';
import Header from './Header';
import AlbumCard from './AlbumCard';
import AlbumDetail from './AlbumDetail';
import Spinner from './Spinner';
import ShareModal from './ShareModal';
import Modal from './Modal';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [editedAlbumName, setEditedAlbumName] = useState('');
  const [editedAlbumDescription, setEditedAlbumDescription] = useState('');

  const [albumToShare, setAlbumToShare] = useState<Album | null>(null);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
      }, (error) => {
        console.error("Error fetching albums: ", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user]);

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAlbumName.trim()) return;

    try {
      await db.collection('albums').add({
        name: newAlbumName,
        description: newAlbumDescription,
        userId: user.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        isPublic: false,
      });
      setNewAlbumName('');
      setNewAlbumDescription('');
      setCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating album:", error);
      setAlertInfo({ title: "Error", message: "Error al crear el álbum." });
    }
  };

  const handleOpenEditModal = (album: Album) => {
    setAlbumToEdit(album);
    setEditedAlbumName(album.name);
    setEditedAlbumDescription(album.description || '');
    setEditModalOpen(true);
  };

  const handleUpdateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumToEdit || !editedAlbumName.trim()) return;

    try {
      await db.collection('albums').doc(albumToEdit.id).update({
        name: editedAlbumName,
        description: editedAlbumDescription,
      });
      setEditModalOpen(false);
      setAlbumToEdit(null);
    } catch (error) {
      console.error("Error updating album:", error);
      setAlertInfo({ title: "Error", message: "Error al actualizar el álbum." });
    }
  };


  const handleDeleteAlbum = async (albumId: string) => {
    if (!user) {
      console.error("User not logged in.");
      return;
    }
    if (!window.confirm("¿Estás seguro de que quieres eliminar este álbum y todas sus fotos? Esta acción no se puede deshacer.")) return;
    
    try {
      // Step 1: Query for all photo documents in the album to get their storage URLs.
      const photosQuery = db.collection('photos')
        .where('albumId', '==', albumId)
        .where('userId', '==', user.uid);
      
      const photosSnapshot = await photosQuery.get();
      
      // Step 2: Concurrently delete all associated files from Cloud Storage.
      const storageDeletePromises = photosSnapshot.docs.map(doc => {
        const photoData = doc.data() as Photo;
        if (photoData.url) {
          const photoRef = storage.refFromURL(photoData.url);
          return photoRef.delete().catch(error => {
            // It's okay if the file is already gone. Log other errors.
            if (error.code !== 'storage/object-not-found') {
              console.error(`Error deleting file ${photoData.fileName} from storage:`, error);
            }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(storageDeletePromises);
      
      // Step 3: Delete the album and all its photo documents from Firestore in a single atomic batch.
      const batch = db.batch();

      photosSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      const albumRef = db.collection('albums').doc(albumId);
      batch.delete(albumRef);

      await batch.commit();

    } catch (error: any) {
        console.error("Error deleting album and its photos:", error);
        let userMessage = "Error al eliminar el álbum.";
        let title = "Error";
        // Provide a more specific message for the most likely cause.
        if (error.code === 'permission-denied') {
          title = "Permiso Denegado";
          userMessage = "No tienes permisos para eliminar este álbum. Contacta al administrador.";
        }
        setAlertInfo({ title, message: userMessage });
    }
  };
  
  const handleOpenShareModal = (album: Album) => {
    setAlbumToShare(album);
    setShareModalOpen(true);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950">
            <Spinner />
        </div>
    );
  }
  
  if (selectedAlbum) {
    return <AlbumDetail album={selectedAlbum} onBack={() => setSelectedAlbum(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="container p-4 mx-auto md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold">Mis Álbumes</h1>
          {isAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 font-semibold text-white transition-colors bg-violet-600 rounded-md hover:bg-violet-700"
            >
              Crear Álbum
            </button>
          )}
        </div>
        
        {albums.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>No tienes álbumes todavía.</p>
            {isAdmin && <p>¡Crea tu primer álbum para empezar!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {albums.map(album => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => setSelectedAlbum(album)}
                onDelete={() => handleDeleteAlbum(album.id)}
                onShare={() => handleOpenShareModal(album)}
                onEdit={() => handleOpenEditModal(album)}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </main>

      {isAdmin && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Crear Nuevo Álbum"
        >
          <form onSubmit={handleCreateAlbum}>
              <div className="mb-4">
                  <label htmlFor="albumName" className="block mb-2 text-sm font-medium text-gray-300">Nombre del Álbum</label>
                  <input
                      type="text"
                      id="albumName"
                      value={newAlbumName}
                      onChange={(e) => setNewAlbumName(e.target.value)}
                      className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                      required
                  />
              </div>
              <div className="mb-6">
                  <label htmlFor="albumDescription" className="block mb-2 text-sm font-medium text-gray-300">Descripción (opcional)</label>
                  <textarea
                      id="albumDescription"
                      value={newAlbumDescription}
                      onChange={(e) => setNewAlbumDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setCreateModalOpen(false)} className="px-4 py-2 text-gray-300 transition-colors bg-gray-600 rounded-md hover:bg-gray-500">
                      Cancelar
                  </button>
                  <button type="submit" className="px-4 py-2 font-semibold text-white transition-colors bg-violet-600 rounded-md hover:bg-violet-700">
                      Crear
                  </button>
              </div>
          </form>
        </Modal>
      )}

      {isAdmin && albumToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="Editar Álbum"
        >
          <form onSubmit={handleUpdateAlbum}>
            <div className="mb-4">
              <label htmlFor="editAlbumName" className="block mb-2 text-sm font-medium text-gray-300">Nombre del Álbum</label>
              <input
                type="text"
                id="editAlbumName"
                value={editedAlbumName}
                onChange={(e) => setEditedAlbumName(e.target.value)}
                className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="editAlbumDescription" className="block mb-2 text-sm font-medium text-gray-300">Descripción (opcional)</label>
              <textarea
                id="editAlbumDescription"
                value={editedAlbumDescription}
                onChange={(e) => setEditedAlbumDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button type="button" onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-gray-300 transition-colors bg-gray-600 rounded-md hover:bg-gray-500">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 font-semibold text-white transition-colors bg-violet-600 rounded-md hover:bg-violet-700">
                Guardar Cambios
              </button>
            </div>
          </form>
        </Modal>
      )}
      
      {isAdmin && albumToShare && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setAlbumToShare(null);
          }}
          album={albumToShare}
        />
      )}

      {/* Alert Modal */}
      {!!alertInfo && (
        <Modal
          isOpen={!!alertInfo}
          onClose={() => setAlertInfo(null)}
          title={alertInfo.title}
        >
          <div>
            <p className="text-slate-300">{alertInfo.message}</p>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setAlertInfo(null)} className="px-4 py-2 font-semibold text-white transition-colors rounded-md bg-violet-600 hover:bg-violet-700">
                    Aceptar
                </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Gallery;