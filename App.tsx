import React, { useState, useEffect } from 'react';
import { auth } from './services/firebase';
import firebase from 'firebase/compat/app'; // For User type
import Login from './components/Login';
import Gallery from './components/Gallery';
import Spinner from './components/Spinner';
import PublicAlbumView from './components/PublicAlbumView';

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPublicView, setIsPublicView] = useState(false);
  const [publicAlbumId, setPublicAlbumId] = useState<string | null>(null);

  useEffect(() => {
    // Check for public album route
    const path = window.location.pathname;
    if (path.startsWith('/public/album/')) {
      const parts = path.split('/');
      const albumId = parts[3];
      if (albumId) {
        setIsPublicView(true);
        setPublicAlbumId(albumId);
        setLoading(false);
        return; // Skip auth check for public view
      }
    }

    // Auth state listener
    const unsubscribe = auth.onAuthStateChanged(user => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }
  
  if (isPublicView && publicAlbumId) {
    return <PublicAlbumView albumId={publicAlbumId} />;
  }

  return user ? <Gallery /> : <Login />;
};

export default App;
