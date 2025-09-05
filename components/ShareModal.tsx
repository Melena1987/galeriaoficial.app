import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Album } from '../types';
import Modal from './Modal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, album }) => {
  const [isPublic, setIsPublic] = useState(album.isPublic || false);
  const [shareableLink, setShareableLink] = useState('');

  useEffect(() => {
    const currentIsPublic = album.isPublic || false;
    setIsPublic(currentIsPublic);
    if (currentIsPublic) {
      // The path format '#/public/album/...' is determined by App.tsx's routing logic
      const link = `${window.location.origin}${window.location.pathname}#/public/album/${album.id}`;
      setShareableLink(link);
    } else {
      setShareableLink('');
    }
  }, [album, isOpen]);

  const handleTogglePublic = async () => {
    const newIsPublic = !isPublic;
    try {
      await db.collection('albums').doc(album.id).update({ isPublic: newIsPublic });
      setIsPublic(newIsPublic);
    } catch (error) {
      console.error("Error updating album public status:", error);
      alert('No se pudo actualizar el estado del álbum.');
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      alert('¡Enlace copiado al portapapeles!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('No se pudo copiar el enlace.');
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Compartir "${album.name}"`}>
      <div className="flex items-center justify-between mb-4">
        <label htmlFor="public-toggle" className="text-gray-300">
          {isPublic ? 'Este álbum es público' : 'Hacer este álbum público'}
        </label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none">
          <input 
            type="checkbox" 
            name="public-toggle" 
            id="public-toggle" 
            checked={isPublic}
            onChange={handleTogglePublic}
            className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer checked:right-0 checked:bg-blue-500"
          />
          <label htmlFor="public-toggle" className="block h-6 overflow-hidden bg-gray-600 rounded-full cursor-pointer"></label>
        </div>
      </div>
      
      {isPublic && (
        <div>
          <p className="mb-2 text-sm text-gray-400">Cualquiera con el siguiente enlace puede ver este álbum:</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareableLink}
              className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 font-semibold text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ShareModal;
