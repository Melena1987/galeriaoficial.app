import React, { useState, useRef } from 'react';
import { storage, db, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';

interface UploadFormProps {
  albumId: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ albumId }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(Array.from(e.target.files));
    }
  };

  const handleUpload = async (files: File[]) => {
    const user = auth.currentUser;
    if (!user || files.length === 0) return;

    setUploading(true);
    setError(null);

    let uploadsFinished = 0;

    for (const file of files) {
      const storageRef = storage.ref(`users/${user.uid}/photos/${file.name}`);
      const uploadTask = storageRef.put(file);

      uploadTask.on(
        'state_changed',
        snapshot => {
          const prog = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(prog);
        },
        err => {
          console.error(err);
          setError('Error al subir el archivo. Inténtalo de nuevo.');
          setUploading(false);
        },
        async () => {
          const url = await storageRef.getDownloadURL();
          const photoData = {
            albumId,
            userId: user.uid,
            url,
            fileName: file.name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          };
          
          await db.collection('photos').add(photoData);

          const albumRef = db.collection('albums').doc(albumId);
          const albumDoc = await albumRef.get();
          if (albumDoc.exists && !albumDoc.data()?.coverPhotoUrl) {
            await albumRef.update({ coverPhotoUrl: url });
          }

          uploadsFinished++;
          if (uploadsFinished === files.length) {
            setUploading(false);
            setProgress(0);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }
      );
    }
  };

  return (
    <div className="p-4 mb-6 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg">
      <div className="flex flex-col items-center justify-center">
        <label htmlFor="file-upload" className="relative font-medium text-blue-500 rounded-md cursor-pointer hover:text-blue-400">
          <span>Selecciona fotos para subir</span>
          <input 
            id="file-upload" 
            name="file-upload" 
            type="file" 
            className="sr-only" 
            multiple 
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
          />
        </label>
        <p className="mt-1 text-xs text-gray-400">O arrastra y suelta los archivos aquí</p>
      </div>
      {uploading && (
        <div className="w-full mt-4">
          <p className="mb-1 text-sm text-center text-gray-300">Subiendo... {progress}%</p>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-center text-red-500">{error}</p>}
    </div>
  );
};

export default UploadForm;
