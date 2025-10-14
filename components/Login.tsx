import React, { useState } from 'react';
import { auth } from '../services/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

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

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
            required
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 font-semibold text-white transition-colors duration-300 rounded-lg bg-violet-600 hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-violet-500"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;