import React, { useState, useEffect } from 'react';
// FIX: Removed unused v9 modular imports. The v8 API uses methods on the db object.
import { db } from '../services/firebase';
import type { Album } from '../types';
import Header from './Header';
import UploadForm from './UploadForm';
import AlbumCard from './AlbumCard';
import Spinner from './Spinner';

const Gallery: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // FIX: Use db.collection().orderBy() for v8 query syntax.
    const q = db.collection("albums").orderBy("createdAt", "desc");
    
    // FIX: Use q.onSnapshot() to attach a listener with the v8 API.
    const unsubscribe = q.onSnapshot((querySnapshot) => {
      const albumsData: Album[] = [];
      querySnapshot.forEach((doc) => {
        albumsData.push({ id: doc.id, ...doc.data() } as Album);
      });
      setAlbums(albumsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div id="app-container" className="min-h-screen text-white bg-gray-900">
      <Header />
      <main className="container px-4 py-8 mx-auto md:px-6 lg:px-8">
        <UploadForm />
        <div className="mt-12">
          <h2 className="mb-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">Álbumes</h2>
          {loading ? (
            <div className="flex justify-center mt-10">
              <Spinner />
            </div>
          ) : (
            <div id="gallery-grid" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
          {!loading && albums.length === 0 && (
            <p className="text-center text-gray-400">No hay álbumes para mostrar. ¡Sube tu primera foto!</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Gallery;
