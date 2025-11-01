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
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    // Check for embed mode from URL query parameters.
    const searchParams = new URLSearchParams(window.location.search);
    setIsEmbedded(searchParams.get('embed') === 'true');

    const getAlbumIdFromHash = () => {
      const path = window.location.hash.substring(1);
      if (path.startsWith('/public/album/')) {
        const parts = path.split('/');
        return parts[3] || null;
      }
      return null;
    };
    
    const handleHashChange = () => {
      const albumId = getAlbumIdFromHash();
      setPublicAlbumId(albumId);
    };
    
    // Initial check
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // This effect only sets up hash listening.

  useEffect(() => {
    // This effect reacts to publicAlbumId changes and manages auth state.
    setLoading(true);
    let unsubscribe: firebase.Unsubscribe = () => {};

    if (publicAlbumId) {
      // Public view, no auth needed, just stop loading.
      setUser(null); // Ensure user is logged out for public view
      setLoading(false);
    } else {
      // Private view, set up auth listener.
      unsubscribe = auth.onAuthStateChanged(user => {
        setUser(user);
        setLoading(false);
      });
    }
    
    return () => unsubscribe();
  }, [publicAlbumId]); // Re-run when we switch between public and private views.

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Spinner />
      </div>
    );
  }
  
  if (publicAlbumId) {
    return <PublicAlbumView albumId={publicAlbumId} isEmbedded={isEmbedded} />;
  }

  return user ? <Gallery /> : <Login />;
};

export default App;