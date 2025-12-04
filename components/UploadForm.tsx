import React, { useState, useRef, useCallback } from 'react';
import { storage, db, auth } from '../services/firebase';
import firebase from 'firebase/compat/app';

interface UploadFormProps {
  albumId: string;
}

const UploadForm: React.FC<UploadFormProps> = ({ albumId }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: File[]) => {
    const user = auth.currentUser;
    if (!user || files.length === 0) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    // Used to calculate aggregate progress
    const progressData: { [key: string]: { transferred: number; total: number } } = {};
    files.forEach(file => {
      // Create a unique key for each file to track its progress
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
      progressData[fileKey] = { transferred: 0, total: file.size };
    });

    const uploadPromises = files.map(file => {
      return new Promise<void>((resolve, reject) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        
        // Sanitize file name and make it unique to avoid collisions and path errors.
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
        const storageRef = storage.ref(`users/${user.uid}/photos/${uniqueFileName}`);
        
        const uploadTask = storageRef.put(file);

        uploadTask.on(
          'state_changed',
          snapshot => {
            progressData[fileKey].transferred = snapshot.bytesTransferred;
            
            const totalTransferred = Object.values(progressData).reduce((acc, { transferred }) => acc + transferred, 0);
            const totalSize = Object.values(progressData).reduce((acc, { total }) => acc + total, 0);
            
            const overallProgress = totalSize > 0 ? Math.round((totalTransferred / totalSize) * 100) : 0;
            setProgress(overallProgress);
          },
          err => {
            console.error(err);
            setError(`Error al subir ${file.name}.`);
            reject(err);
          },
          async () => {
            try {
              const url = await storageRef.getDownloadURL();
              const isVideo = file.type.startsWith('video/');
              
              const photoData = {
                albumId,
                userId: user.uid,
                url,
                fileName: file.name, // Keep original file name for metadata
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                type: isVideo ? 'video' : 'image',
                mimeType: file.type
              };
              
              await db.collection('photos').add(photoData);

              // Check if album needs a cover photo (only use images for cover if possible, but video works too if needed)
              const albumRef = db.collection('albums').doc(albumId);
              const albumDoc = await albumRef.get();
              // Prefer images for cover photos, but take what we get if it's the first upload
              if (albumDoc.exists && !albumDoc.data()?.coverPhotoUrl) {
                await albumRef.update({ coverPhotoUrl: url });
              }
              resolve();
            } catch (dbError) {
              console.error("Firestore error:", dbError);
              setError(`Error al guardar datos de ${file.name}.`);
              reject(dbError);
            }
          }
        );
      });
    });

    try {
      await Promise.all(uploadPromises);
      // Wait a bit before hiding progress so user sees 100%
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 500);
    } catch (err) {
      // Error is set inside the listener, but we need to stop the uploading state
      setUploading(false);
    }
  }, [albumId]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleUpload(Array.from(e.target.files));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const ringColor = isDragging ? 'border-violet-500' : 'border-slate-600';
  const bgColor = isDragging ? 'bg-slate-700/50' : 'bg-slate-800/50';

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      className={`p-4 mb-6 border-2 border-dashed rounded-lg transition-colors ${ringColor} ${bgColor}`}
    >
      <div className="flex flex-col items-center justify-center">
        <label htmlFor="file-upload" className="relative font-semibold text-violet-400 rounded-md cursor-pointer hover:text-violet-300">
          <span>Selecciona fotos o vídeos</span>
          <input 
            id="file-upload" 
            name="file-upload" 
            type="file" 
            accept="image/*,video/*"
            className="sr-only" 
            multiple 
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={uploading}
          />
        </label>
        <p className="mt-1 text-sm text-slate-400">O arrastra y suelta los archivos aquí</p>
      </div>
      {uploading && (
        <div className="w-full mt-4">
          <p className="mb-1 text-sm text-center text-slate-300">Subiendo... {progress}%</p>
          <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div className="bg-violet-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-center text-rose-500">{error}</p>}
    </div>
  );
};

export default UploadForm;