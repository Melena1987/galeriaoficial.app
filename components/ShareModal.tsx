import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { Album } from '../types';
import Modal from './Modal';
import Spinner from './Spinner';

interface ShareModalProps {
  albumId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ albumId, isOpen, onClose }) => {
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  const shareUrl = `${window.location.origin}/#/public/album/${albumId}`;
  const embedCode = `<iframe src="${shareUrl}" width="100%" height="600px" frameborder="0"></iframe>`;

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const unsubscribe = db.collection('albums').doc(albumId).onSnapshot(doc => {
        if (doc.exists) {
          setAlbum({ id: doc.id, ...doc.data() } as Album);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [albumId, isOpen]);

  const handleTogglePublic = async () => {
    if (!album) return;
    await db.collection('albums').doc(albumId).update({
      isPublic: !album.isPublic,
    });
  };

  const handleCopy = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartir Álbum">
      {loading ? <div className="flex justify-center"><Spinner /></div> : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
            <span className="font-medium text-white">Hacer Álbum Público</span>
            <button
              onClick={handleTogglePublic}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${album?.isPublic ? 'bg-indigo-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${album?.isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          {album?.isPublic ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Cualquiera con el enlace podrá ver este álbum.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-300">Enlace para Compartir</label>
                <div className="flex mt-1 space-x-2">
                  <input type="text" value={shareUrl} readOnly className="w-full px-3 py-2 text-gray-300 bg-gray-900 border border-gray-600 rounded-md"/>
                  <button onClick={() => handleCopy(shareUrl, 'link')} className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-28">{copiedLink ? '¡Copiado!' : 'Copiar'}</button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Código de Inserción (Embed)</label>
                <div className="flex mt-1 space-x-2">
                  <input type="text" value={embedCode} readOnly className="w-full px-3 py-2 text-gray-300 bg-gray-900 border border-gray-600 rounded-md"/>
                  <button onClick={() => handleCopy(embedCode, 'embed')} className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 w-28">{copiedEmbed ? '¡Copiado!' : 'Copiar'}</button>
                </div>
              </div>
            </div>
          ) : (
            <p className="p-4 text-center text-gray-400 bg-gray-700 rounded-md">
              Activa la opción "Público" para generar un enlace para compartir.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ShareModal;
