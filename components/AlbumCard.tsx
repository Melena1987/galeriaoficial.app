import React from 'react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onSelectAlbum: (albumId: string) => void;
  onDeleteAlbum: (albumId: string) => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, onSelectAlbum, onDeleteAlbum }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelectAlbum from firing when delete is clicked
    onDeleteAlbum(album.id);
  };
  
  return (
    <div 
      className="relative overflow-hidden transition-transform duration-300 transform bg-gray-800 rounded-lg shadow-lg cursor-pointer group hover:scale-105"
      onClick={() => onSelectAlbum(album.id)}
    >
      <div className="aspect-w-1 aspect-h-1">
        <img
            src={album.coverPhotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(album.name)}&background=2d3748&color=edf2f7&size=400`}
            alt={album.name}
            className="object-cover w-full h-full"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full p-4">
        <h3 className="text-lg font-bold text-white truncate">{album.name}</h3>
        {album.description && <p className="text-sm text-gray-300 truncate">{album.description}</p>}
      </div>
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 z-10 p-2 text-white transition-opacity bg-red-600 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800"
        aria-label="Eliminar álbum"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default AlbumCard;
