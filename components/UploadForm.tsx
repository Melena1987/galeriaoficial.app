// FIX: Implemented the UploadForm component to resolve module and parsing errors.
import React, { useState } from 'react';
import { db, storage, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';
import { Album } from '../types';
import Spinner from './Spinner';

interface UploadFormProps {
  album?: Album; // Optional album prop
  onAlbumCreated: () => void; // This is also used for photo added
}

const UploadForm: React.FC<UploadFormProps> = ({ album, onAlbumCreated }) => {
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

  const resetForm = () => {
    setAlbumName('');
    setAlbumDescription('');
    setFiles(null);
    // Also reset the file input visually
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Debes iniciar sesión para subir fotos.");
      return;
    }
    if (!files || files.length === 0) {
      setError("Por favor, selecciona al menos una foto para subir.");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      let targetAlbumId = album?.id;
      let isNewAlbum = false;

      // If no album is provided, create a new one first.
      if (!album) {
        if (!albumName.trim()) {
            setError("Por favor, ingresa un nombre para el nuevo álbum.");
            setUploading(false);
            return;
        }
        isNewAlbum = true;
        const albumRef = await db.collection('albums').add({
          name: albumName,
          description: albumDescription,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          userId: user.uid,
        });
        targetAlbumId = albumRef.id;
      }
      
      if (!targetAlbumId) {
        throw new Error("No album ID available.");
      }

      const uploadPromises = Array.from(files).map((file, index) => {
        const fileId = `${Date.now()}-${file.name}`;
        const storageRef = storage.ref(`photos/${user.uid}/${targetAlbumId}/${fileId}`);
        const uploadTask = storageRef.put(file);

        return new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              // Only update progress for the first file for simplicity
              if (index === 0) {
                const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setProgress(currentProgress);
              }
            },
            (error) => {
              console.error("Upload error:", error);
              reject(error);
            },
            async () => {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
              const photoDoc = {
                albumId: targetAlbumId,
                userId: user.uid,
                url: downloadURL,
                fileName: file.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
              };
              await db.collection('photos').add(photoDoc);
              
              // If it's a new album and this is the first photo, set it as cover photo
              if (isNewAlbum && index === 0) {
                await db.collection('albums').doc(targetAlbumId).update({
                  coverPhotoUrl: downloadURL
                });
              }
              resolve();
            }
          );
        });
      });
      
      await Promise.all(uploadPromises);

      onAlbumCreated(); // Notify parent component
      resetForm();

    } catch (err: any) {
      console.error("Error during upload process:", err);
      setError("Ocurrió un error al subir las fotos. Por favor, intente de nuevo.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-xl">
        <h2 className="mb-4 text-xl font-bold text-white">
            {album ? `Subir Fotos a "${album.name}"` : "Crear Nuevo Álbum"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            {!album && (
                <>
                    <div>
                        <label htmlFor="album-name" className="block text-sm font-medium text-gray-300">Nombre del Álbum</label>
                        <input
                            id="album-name"
                            type="text"
                            value={albumName}
                            onChange={(e) => setAlbumName(e.target.value)}
                            placeholder="Ej: Vacaciones de Verano"
                            required
                            className="block w-full px-3 py-2 mt-1 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="album-description" className="block text-sm font-medium text-gray-300">Descripción (opcional)</label>
                        <textarea
                            id="album-description"
                            value={albumDescription}
                            onChange={(e) => setAlbumDescription(e.target.value)}
                            rows={2}
                            placeholder="Una breve descripción del álbum"
                            className="block w-full px-3 py-2 mt-1 text-white placeholder-gray-500 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </>
            )}
            <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300">Seleccionar Fotos</label>
                <div className="flex items-center justify-center w-full mt-1">
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 px-4 transition bg-gray-700 border-2 border-gray-600 border-dashed rounded-md cursor-pointer hover:bg-gray-600 hover:border-gray-500">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click para subir</span> o arrastra y suelta</p>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                        </div>
                        <input id="file-upload" name="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
                {files && files.length > 0 && (
                    <p className="mt-2 text-sm text-gray-400">{files.length} archivo(s) seleccionado(s)</p>
                )}
            </div>
            
            {uploading && (
                <div className="w-full bg-gray-700 rounded-full">
                    <div
                        className="p-0.5 text-xs font-medium text-center text-blue-100 bg-blue-600 rounded-full"
                        style={{ width: `${progress}%` }}
                    >
                        {Math.round(progress)}%
                    </div>
                </div>
            )}
            
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
                type="submit"
                disabled={uploading}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
                {uploading ? <div className="flex items-center justify-center"><Spinner /> <span className="ml-2">Subiendo...</span></div> : (album ? "Añadir Fotos" : "Crear Álbum y Subir")}
            </button>
        </form>
    </div>
  );
};

export default UploadForm;
