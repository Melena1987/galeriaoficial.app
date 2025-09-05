import React, { useState } from 'react';
// FIX: Removed unused v9 modular imports. The v8 API uses methods on the auth object.
import { auth, googleProvider } from '../services/firebase';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // FIX: Use auth.signInWithEmailAndPassword for v8 API.
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      setError('Credenciales inválidas. Por favor, intente de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      // FIX: Use auth.signInWithPopup for v8 API.
      await auth.signInWithPopup(googleProvider);
    } catch (err: any) {
      setError('No se pudo iniciar sesión con Google. Intente de nuevo.');
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };


  return (
    <div id="login-container" className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-white">Iniciar Sesión</h2>
          <p className="mt-2 text-center text-gray-400">Accede a tu galería de fotos</p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-3 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-400">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="relative flex justify-center w-full px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md group hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>

        <div className="relative flex items-center justify-center py-2">
            <div className="w-full border-t border-gray-600"></div>
            <span className="absolute px-3 text-sm text-gray-400 bg-gray-800">O</span>
        </div>

        <div>
            <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="relative flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-800 bg-white border border-transparent rounded-md group hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.2 74.8C307.7 99.8 280.7 86 248 86c-84.3 0-152.3 68.2-152.3 152S163.7 390 248 390c47.8 0 92.7-22.1 120.3-58.8l-77.2-61.9H248v-87.7h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                {googleLoading ? 'Iniciando...' : 'Iniciar Sesión con Google'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
