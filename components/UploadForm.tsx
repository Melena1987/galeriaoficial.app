import React, { useState } from 'react';
// FIX: Import firebase from compat layer for serverTimestamp.
import firebase from 'firebase/compat/app';
import { db, storage } from '../services/firebase';

const UploadForm: React.FC = () => {
  const [albumName, setAlbumName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumName.trim() || !file) {
      setError('Por favor, complete todos los campos.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a unique file name
      const fileName = `${new Date().getTime()}_${file.name}`;
      // FIX: Use storage.ref() for v8 API.
      const storageRef = storage.ref(`images/${fileName}`);

      // Upload file to Storage
      // FIX: Use storageRef.put() for v8 API.
      const uploadTask = await storageRef.put(file);

      // Get download URL
      // FIX: Use uploadTask.ref.getDownloadURL() for v8 API.
      const downloadURL = await uploadTask.ref.getDownloadURL();

      // Add document to Firestore
      // FIX: Use db.collection().add() for v8 API.
      await db.collection('albums').add({
        nombre: albumName,
        imagenURL: downloadURL,
        // FIX: Use firebase.firestore.FieldValue.serverTimestamp() for v8 API.
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setSuccess('¡Álbum subido con éxito!');
      // Reset form
      setAlbumName('');
      setFile(null);
      // This is to reset the file input visually
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (err) {
      console.error("Error uploading file:", err);
      setError('Ocurrió un error al subir la imagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="upload-form" className="p-6 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="mb-4 text-xl font-semibold">Subir Nueva Foto</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="album-name" className="block mb-2 text-sm font-medium text-gray-300">
            Nombre del Álbum
          </label>
          <input
            type="text"
            id="album-name"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            className="block w-full px-3 py-2 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Ej: Vacaciones en la playa"
          />
        </div>
        <div>
          <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-300">
            Seleccionar archivo
          </label>
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-400 border border-gray-600 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 focus:outline-none"
          />
        </div>
        
        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 font-medium text-white transition-colors bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Subiendo...' : 'Subir Álbum'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;