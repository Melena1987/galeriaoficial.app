import React from 'react';
import { auth } from '../services/firebase';

const Header: React.FC = () => {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out.");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/75 backdrop-blur-lg ring-1 ring-white/10">
      <div className="container flex items-center justify-between h-full mx-auto px-4 md:px-6">
        <div className="text-center">
            <h1 className="text-lg font-black tracking-widest uppercase text-slate-200">
              GaleríaOficial.app
            </h1>
            <p className="hidden -mt-1 text-xs font-medium tracking-wider text-slate-400 sm:block">
              BY MANU
            </p>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=8b5cf6&color=fff`} 
              alt={user.displayName || 'User Avatar'} 
              className="w-9 h-9 rounded-full ring-2 ring-offset-2 ring-offset-slate-900 ring-violet-500"
            />
          )}
          <button
            onClick={handleSignOut}
            className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Cerrar Sesión"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
