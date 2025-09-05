import React, { useState } from 'react';
import { auth, googleProvider } from '../services/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await auth.signInWithPopup(googleProvider);
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError("No se pudo iniciar sesión con Google. Intente de nuevo.");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      console.error("Error signing in with email:", error);
      setError("Correo o contraseña incorrectos.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-8 rounded-2xl bg-slate-900/50 ring-1 ring-white/10">
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-widest uppercase text-slate-200">
            GaleríaOficial.app
          </h1>
          <p className="mt-1 text-sm font-medium tracking-wider text-slate-400">
            BY MANU
          </p>
        </div>
        
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Iniciar Sesión</h2>
          <p className="mt-2 text-slate-400">Accede a tu galería de fotos</p>
        </div>
        
        {error && <p className="text-sm text-center text-rose-500">{error}</p>}

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full gap-3 px-4 py-3 font-semibold text-white transition-all duration-300 rounded-lg bg-violet-600 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
          >
            <svg className="w-5 h-5" xmlns="http://www.w.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.398 7.618C34.311 4.01 29.492 2 24 2C11.854 2 2 11.854 2 24s9.854 22 22 22s22-9.854 22-22c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691c-1.332 2.646-2.106 5.617-2.106 8.715s.774 6.069 2.106 8.715L11.531 32c-1.979-3.522-3.225-7.69-3.225-12s1.246-8.478 3.225-12L6.306 14.691z" />
              <path fill="#4CAF50" d="M24 46c5.94 0 11.213-1.996 15.086-5.342l-5.126-5.126c-2.344 1.566-5.276 2.468-8.96 2.468c-6.233 0-11.52-3.832-13.414-9.032l-5.46 4.72C8.613 39.421 15.717 46 24 46z" />
              <path fill="#1976D2" d="M43.611 20.083L43.611 20.083H42V20H24v8h11.303c-0.792 2.237-2.231 4.166-4.087 5.571l5.126 5.126C39.991 35.341 44 28.163 44 20c0-1.341-0.138-2.65-0.389-3.917z" />
            </svg>
            Iniciar sesión con Google
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="mx-4 text-xs font-medium text-slate-500">O</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-3 font-semibold transition-colors duration-300 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
          >
            Iniciar Sesión con Correo
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
