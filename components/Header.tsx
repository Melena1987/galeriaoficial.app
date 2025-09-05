import React from 'react';
// FIX: Removed unused v9 modular import. The v8 API uses a method on the auth object.
import { auth } from '../services/firebase';

const Header: React.FC = () => {
  const handleLogout = async () => {
    try {
      // FIX: Use auth.signOut() for the v8 API.
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-gray-800/80 backdrop-blur-sm shadow-md">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto md:px-6 lg:px-8">
        <h1 className="text-xl font-bold tracking-wider text-white uppercase">
          GaleríaOficial.app by Manu
        </h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm font-medium text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;