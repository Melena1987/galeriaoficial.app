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
  const [publicAlbumId, setPublicAlbumId] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const path = window.location.hash.substring(1); // from '#/public/album/...' to '/public/album/...'
      if (path.startsWith('/public/album/')) {
        const parts = path.split('/');
        const albumId = parts[3];
        if (albumId) {
          setPublicAlbumId(albumId);
          // If we are showing a public album, we don't need the user state.
          // Set loading to false directly.
          if (loading) setLoading(false);
        }
      } else {
        setPublicAlbumId(null);
      }
    };

    // Initial check
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Auth state listener only runs if not a public view initially
    let unsubscribe: firebase.Unsubscribe = () => {};
    if (!publicAlbumId) {
        unsubscribe = auth.onAuthStateChanged(user => {
            setUser(user);
            setLoading(false);
        });
    }

    return () => {
        window.removeEventListener('hashchange', handleHashChange);
        unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }
  
  if (publicAlbumId) {
    return <PublicAlbumView albumId={publicAlbumId} />;
  }

  return user ? <Gallery /> : <Login />;
};

export default App;