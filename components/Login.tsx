import React from 'react';
import { auth, googleProvider } from '../services/firebase';

const Login: React.FC = () => {
  const signInWithGoogle = () => {
    auth.signInWithPopup(googleProvider).catch(error => {
      console.error("Error signing in with Google:", error);
      alert(error.message);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen font-sans bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-8 text-center bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl">
        <div className="mb-4">
            <h1 className="text-4xl font-extrabold tracking-wider text-transparent uppercase bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
                GALERÍAOFICIAL.APP
            </h1>
            <p className="text-lg font-light tracking-widest text-slate-400">BY MANU</p>
        </div>
        <div className="text-center text-slate-300">
            <h2 className="text-2xl font-semibold">Iniciar Sesión</h2>
            <p className="mt-1 text-slate-400">Accede a tu galería de fotos</p>
        </div>
        <button
          onClick={signInWithGoogle}
          className="flex items-center justify-center w-full gap-3 px-6 py-3 font-semibold text-white transition-all duration-300 transform bg-violet-600 rounded-lg shadow-lg hover:bg-violet-500 hover:scale-105"
        >
          <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="M6.306 14.691c-1.353 2.959-2.065 6.273-2.065 9.755s.712 6.796 2.065 9.755l-5.657 5.657C.247 35.134 0 30.01 0 24.446s.247-10.688 1.814-15.413l5.657 5.658z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-5.657-5.657C30.078 35.399 27.225 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-5.657 5.657C9.033 41.536 15.908 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/></svg>
          Iniciar sesión con Google
        </button>
      </div>
    </div>
  );
};

export default Login;
