import React, { useState, useEffect } from 'react';
// FIX: Import firebase from 'firebase/compat/app' to get access to the v8 namespaced API.
import firebase from 'firebase/compat/app';
import { auth } from './services/firebase';
import Login from './components/Login';
import Gallery from './components/Gallery';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  // FIX: Use firebase.User for the user state type, which is the correct type for a user object in the Firebase v8 API.
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // FIX: Switched from the v9 modular onAuthStateChanged(auth, ...) to the v8 namespaced method auth.onAuthStateChanged(...).
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {user ? <Gallery /> : <Login />}
    </div>
  );
};

export default App;