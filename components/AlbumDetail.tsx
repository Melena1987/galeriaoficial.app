import React, { useState, useEffect, useMemo } from 'react';
import { db, storage, auth } from '../services/firebase';
import { Album, Photo } from '../types';
import UploadForm from './UploadForm';
import PhotoCard from './PhotoCard';
import Lightbox from './Lightbox';
import Spinner from './Spinner';
import JSZip from 'jszip';
import saveAs from 'file-saver';

interface AlbumDetailProps {
  album: Album;
  onBack: () => void;
}

type SortOrder = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

const AlbumDetail: React.FC<AlbumDetailProps> = ({ album: initialAlbum, onBack }) => {
  const [album, setAlbum] = useState<Album>(initialAlbum);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Initialize sortOrder from localStorage, defaulting to 'oldest'.
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const savedOrder = localStorage.getItem(`albumSortOrder_${initialAlbum.id}`);
    // Type guard to ensure the saved value is valid.
    if (savedOrder === 'newest' || savedOrder === 'oldest' || savedOrder === 'name_asc' || savedOrder === 'name_desc') {
      return savedOrder;
    }
    return 'oldest';
  });

  const user = auth.currentUser;
  const isAdmin = user?.email === 'manudesignsforyou@gmail.com';

  useEffect(() => {
    const unsubscribe = db.collection('albums').doc(album.id)
      .onSnapshot(doc => {
        if (doc.exists) {
          setAlbum({ id: doc.id, ...doc.data() } as Album);
        }
      }, (error) => {
        console.error("Error fetching album updates:", error);
      });
    return () => unsubscribe();
  }, [album.id]);


  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = db.collection('photos')
      .where('albumId', '==', album.id)
      .where('userId', '==', user.uid)
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

  // Save the sort order to localStorage whenever it changes for the current album.
  useEffect(() => {
    localStorage.setItem(`albumSortOrder_${album.id}`, sortOrder);
  }, [sortOrder, album.id]);

  const sortedPhotos = useMemo(() => {
    const sortablePhotos = [...photos];
    switch (sortOrder) {
      case 'oldest':
        // Sorts the photos by creation date (oldest first).
        return sortablePhotos.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
      case 'name_asc':
        return sortablePhotos.sort((a, b) => a.fileName.localeCompare(b.fileName));
      case 'name_desc':
        return sortablePhotos.sort((a, b) => b.fileName.localeCompare(a.fileName));
      case 'newest':
      default:
        return sortablePhotos.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }
  }, [photos, sortOrder]);

  const handleSortChange = () => {
    setSortOrder(currentOrder => {
      if (currentOrder === 'newest') return 'oldest';
      if (currentOrder === 'oldest') return 'name_asc';
      if (currentOrder === 'name_asc') return 'name_desc';
      return 'newest'; // Cycle back to newest
    });
  };

  const getSortTooltip = (): string => {
    switch (sortOrder) {
      case 'newest': return 'Ordenar por: Más antiguas';
      case 'oldest': return 'Ordenar por: Nombre (A-Z)';
      case 'name_asc': return 'Ordenar por: Nombre (Z-A)';
      case 'name_desc': return 'Ordenar por: Más recientes';
      default: return 'Ordenar fotos';
    }
  };
  
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

  const handleSetCoverPhoto = async (photo: Photo) => {
    if (!album.id || !photo.url) return;
    try {
      await db.collection('albums').doc(album.id).update({
        coverPhotoUrl: photo.url,
      });
    } catch (error) {
      console.error("Error setting cover photo:", error);
      alert("No se pudo establecer la foto de portada.");
    }
  };

  const handleDownloadAlbum = async () => {
    if (photos.length === 0) {
      alert("Este álbum está vacío, no hay nada que descargar.");
      return;
    }
    
    setIsDownloading(true);
    alert('Preparando la descarga. Esto puede tardar unos minutos para álbumes grandes. La descarga comenzará automáticamente.');

    try {
      const zip = new JSZip();

      const photoPromises = photos.map(async (photo) => {
        try {
          const response = await fetch(photo.url);
          if (!response.ok) {
              console.error(`Failed to fetch ${photo.url}: ${response.statusText}`);
              return null;
          }
          const blob = await response.blob();
          return { name: photo.fileName, blob };
        } catch(e) {
          console.error(`Error fetching image blob for ${photo.fileName}`, e);
          return null;
        }
      });

      const results = await Promise.all(photoPromises);

      let fileCount = 0;
      results.forEach(result => {
        if (result) {
          zip.file(result.name, result.blob);
          fileCount++;
        }
      });
      
      if (fileCount === 0) {
          alert('No se pudieron descargar las fotos. Revisa la consola para más detalles.');
          return;
      }

      const content = await zip.generateAsync({ type: "blob" });
      const safeAlbumName = album.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      saveAs(content, `${safeAlbumName || 'album'}.zip`);

    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("Ocurrió un error al crear el archivo ZIP. Por favor, inténtalo de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev + 1) % sortedPhotos.length));
  const prevPhoto = () => setLightboxIndex(prev => (prev === null ? null : (prev - 1 + sortedPhotos.length) % sortedPhotos.length));
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(album.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isSelectionMode = isAdmin && selectedPhotos.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 h-auto min-h-16 py-2 bg-slate-900/75 backdrop-blur-lg">
        <div className="container flex items-center justify-between h-full gap-4 mx-auto px-4 md:px-6">
          <div className="flex items-center min-w-0">
            <button onClick={onBack} className="flex-shrink-0 p-2 -ml-2 rounded-full hover:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="ml-4 min-w-0">
              <h1 className="text-xl font-bold truncate">{album.name}</h1>
              <p className="text-sm text-slate-400 truncate">{album.description}</p>
              {isAdmin && (
                <div className="flex items-center gap-2 mt-1.5" title={album.id}>
                  <span className="text-xs font-mono text-slate-500 truncate">ID: {album.id}</span>
                  <button onClick={handleCopyId} className="flex-shrink-0 p-1 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500" aria-label="Copiar ID del álbum">
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {isAdmin && photos.length > 0 && (
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={handleSortChange}
                className="flex items-center justify-center p-2 text-slate-400 transition-colors rounded-full hover:bg-slate-800 hover:text-white"
                title={getSortTooltip()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              </button>
              <button
                onClick={handleDownloadAlbum}
                disabled={isDownloading}
                className="flex items-center justify-center p-2 text-slate-400 transition-colors rounded-full hover:bg-slate-800 hover:text-white disabled:opacity-50 disabled:cursor-wait"
                title="Descargar álbum completo (.zip)"
              >
                {isDownloading ? (
                  <Spinner className="w-6 h-6 border-2" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
              </button>
            </div>
          )}
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
            {sortedPhotos.map((photo, index) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => isSelectionMode ? handleToggleSelect(photo.id) : openLightbox(index)}
                onDelete={() => handleDeletePhoto(photo)}
                isAdmin={isAdmin}
                isSelected={selectedPhotos.includes(photo.id)}
                onSelectToggle={() => handleToggleSelect(photo.id)}
                onSetCover={() => handleSetCoverPhoto(photo)}
                isCover={album.coverPhotoUrl === photo.url}
              />
            ))}
          </div>
        )}
      </main>
      
      {lightboxIndex !== null && (
        <Lightbox 
          photos={sortedPhotos} 
          currentIndex={lightboxIndex} 
          onClose={closeLightbox}
          onNext={nextPhoto}
          onPrev={prevPhoto}
          albumName={album.name}
        />
      )}
    </div>
  );
};

export default AlbumDetail;