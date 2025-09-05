import React, { useState } from 'react';
import firebase from 'firebase/compat/app';
import { auth, db, storage } from '../services/firebase';
import { Album } from '../types';

interface UploadFormProps {
  onAlbumCreated: (albumId: string) => void;
  album?: Album; // Optional: for adding photos to an existing album
}

const UploadForm: React.FC<UploadFormProps> = ({ onAlbumCreated, album }) => {
  const [albumName, setAlbumName] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const user = auth.currentUser;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!album && !albumName) || !files || files.length === 0) {
      setError('Por favor, completa el nombre del álbum y selecciona al menos una foto.');
      return;
    }
    if (!user) {
        setError('Debes iniciar sesión para subir fotos.');
        return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
        let currentAlbumId = album?.id;
        
        // Create new album if not provided
        if (!album) {
            const albumRef = await db.collection('albums').add({
                name: albumName,
                description: albumDescription,
                userId: user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
            currentAlbumId = albumRef.id;
        }

        if (!currentAlbumId) {
            throw new Error("Album ID is missing.");
        }
        
        const totalFiles = files.length;
        let completedFiles = 0;

        const uploadPromises = Array.from(files).map((file, index) => {
            const filePath = `${user.uid}/${currentAlbumId}/${Date.now()}_${file.name}`;
            const storageRef = storage.ref(filePath);
            const uploadTask = storageRef.put(file);

            return new Promise<void>((resolve, reject) => {
                uploadTask.on('state_changed', 
                    (snapshot) => {
                        // This progress is for a single file, so we average it out for total progress
                        const individualProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        // A more accurate total progress would be based on total bytes uploaded vs total bytes of all files.
                        // This is a simpler approximation.
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        await db.collection('photos').add({
                            albumId: currentAlbumId,
                            userId: user.uid,
                            url: downloadURL,
                            fileName: file.name,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        });

                        // Set cover photo for new albums with the first photo
                        if (!album && index === 0) {
                           await db.collection('albums').doc(currentAlbumId).update({
                               coverPhotoUrl: downloadURL
                           });
                        }
                        
                        completedFiles++;
                        setProgress((completedFiles / totalFiles) * 100);

                        resolve();
                    }
                );
            });
        });

        await Promise.all(uploadPromises);

        setAlbumName('');
        setAlbumDescription('');
        setFiles(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

        onAlbumCreated(currentAlbumId);

    } catch (err: any) {
        setError('Ocurrió un error al subir las fotos. Inténtalo de nuevo.');
        console.error(err);
    } finally {
        setUploading(false);
        setProgress(0);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-lg">
      <h3 className="mb-4 text-xl font-bold text-white">{album ? 'Añadir más fotos' : 'Crear Nuevo Álbum'}</h3>
      <form onSubmit={handleSubmit}>
        {!album && (
          <div className="space-y-4">
            <div>
              <label htmlFor="album-name" className="block text-sm font-medium text-gray-300">Nombre del Álbum</label>
              <input
                type="text"
                id="album-name"
                value={albumName}
                onChange={(e) => setAlbumName(e.target.value)}
                className="block w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="album-description" className="block text-sm font-medium text-gray-300">Descripción</label>
              <textarea
                id="album-description"
                rows={3}
                value={albumDescription}
                onChange={(e) => setAlbumDescription(e.target.value)}
                className="block w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300">Seleccionar Fotos</label>
          <div className="flex justify-center px-6 pt-5 pb-6 mt-1 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-400">
                <label htmlFor="file-upload" className="relative font-medium text-indigo-400 bg-gray-800 rounded-md cursor-pointer hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-indigo-500">
                  <span>Sube tus archivos</span>
                  <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="pl-1">o arrástralos aquí</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
            </div>
          </div>
          {files && <p className="mt-2 text-sm text-gray-400">{files.length} archivo(s) seleccionado(s)</p>}
        </div>
        
        {uploading && (
          <div className="w-full mt-4 bg-gray-700 rounded-full">
            <div className="py-1 text-xs font-medium leading-none text-center text-blue-100 bg-blue-600 rounded-full" style={{ width: `${progress}%` }}>
              {Math.round(progress)}%
            </div>
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-6">
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Subiendo...' : (album ? 'Añadir Fotos' : 'Crear Álbum y Subir Fotos')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;
