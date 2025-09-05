import React from 'react';
import { auth } from '../services/firebase';

const Header: React.FC = () => {
  const user = auth.currentUser;

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-800/50 backdrop-blur-lg border-b border-slate-700">
      <div className="container flex items-center justify-between p-4 mx-auto">
        <div className="text-center">
          <h1 className="text-xl font-extrabold tracking-wider text-transparent uppercase bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
              GALERÍAOFICIAL.APP
          </h1>
          <p className="text-xs font-light tracking-widest text-slate-400">BY MANU</p>
        </div>
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-300 sm:block">Hola, {user.displayName || user.email?.split('@')[0]}</span>
            <button
              onClick={handleLogout}
              className="p-2 transition-colors rounded-full text-slate-400 hover:bg-rose-500/20 hover:text-rose-400"
              aria-label="Cerrar Sesión"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
