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
  const [embedCode, setEmbedCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);


  useEffect(() => {
    const currentIsPublic = album.isPublic || false;
    setIsPublic(currentIsPublic);
    setLinkCopied(false);
    setEmbedCopied(false);

    if (currentIsPublic) {
      // The path format '#/public/album/...' is determined by App.tsx's routing logic
      const link = `${window.location.origin}${window.location.pathname}#/public/album/${album.id}`;
      setShareableLink(link);
      
      const embedUrl = `${window.location.origin}${window.location.pathname}?embed=true#/public/album/${album.id}`;
      const safeAlbumName = album.name.replace(/"/g, '&quot;');
      const code = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  style="border:0;"\n  allowfullscreen=""\n  loading="lazy"\n  title="Galería: ${safeAlbumName}"\n></iframe>`;
      setEmbedCode(code);

    } else {
      setShareableLink('');
      setEmbedCode('');
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
  
  const copyToClipboard = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
      } else {
        setEmbedCopied(true);
        setTimeout(() => setEmbedCopied(false), 2500);
      }
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('No se pudo copiar el texto.');
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Compartir "${album.name}"`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-3 rounded-md bg-gray-700/50">
          <label htmlFor="public-toggle" className="font-medium text-gray-300">
            {isPublic ? 'Álbum público y visible' : 'Hacer álbum público'}
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input 
              type="checkbox" 
              name="public-toggle" 
              id="public-toggle" 
              checked={isPublic}
              onChange={handleTogglePublic}
              className="absolute block w-6 h-6 bg-white border-4 rounded-full appearance-none cursor-pointer checked:right-0 checked:bg-violet-500"
            />
            <label htmlFor="public-toggle" className="block h-6 overflow-hidden bg-gray-600 rounded-full cursor-pointer"></label>
          </div>
        </div>
        
        {isPublic ? (
          <div className="space-y-6">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">Compartir enlace</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={shareableLink}
                  className="w-full px-3 py-2 text-gray-300 bg-gray-900/50 border border-gray-600 rounded-md focus:ring-violet-500 focus:border-violet-500"
                />
                <button
                  onClick={() => copyToClipboard(shareableLink, 'link')}
                  className="flex-shrink-0 w-24 px-4 py-2 font-semibold text-white transition-colors bg-violet-600 rounded-md hover:bg-violet-700"
                >
                  {linkCopied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="w-full border-t border-gray-700"></div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">Insertar en una web (HTML)</label>
              <textarea
                readOnly
                value={embedCode}
                rows={6}
                className="w-full p-3 font-mono text-sm text-gray-300 bg-gray-900/50 border border-gray-600 rounded-md resize-none focus:ring-violet-500 focus:border-violet-500"
              />
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="w-full px-4 py-2 mt-2 font-semibold text-white transition-colors bg-violet-600 rounded-md hover:bg-violet-700"
              >
                {embedCopied ? '¡Código Copiado!' : 'Copiar Código HTML'}
              </button>
            </div>
          </div>
        ) : (
           <p className="py-4 text-center text-slate-400">Activa la opción "Hacer álbum público" para poder compartirlo.</p>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;