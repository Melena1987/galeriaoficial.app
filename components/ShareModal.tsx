import React, { useState } from 'react';
import Modal from './Modal';

interface ShareModalProps {
  albumId: string;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ albumId, isOpen, onClose }) => {
  const shareUrl = `${window.location.origin}/public/album/${albumId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('No se pudo copiar el enlace.');
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compartir Álbum">
      <div className="space-y-4">
        <p className="text-sm text-gray-300">
          Cualquier persona con este enlace podrá ver las fotos de este álbum. No podrán editar ni eliminar nada.
        </p>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-3 py-2 text-gray-300 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={handleCopy}
            className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;
