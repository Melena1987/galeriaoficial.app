
import React from 'react';
import type { Album } from '../types';

interface AlbumCardProps {
  album: Album;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album }) => {
  return (
    <div className="overflow-hidden transition-transform duration-300 ease-in-out transform bg-gray-800 rounded-lg shadow-lg group hover:scale-105 hover:shadow-indigo-500/30">
      <div className="relative w-full aspect-square">
        <img
          src={album.imagenURL}
          alt={album.nombre}
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-0 transition-opacity"></div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{album.nombre}</h3>
      </div>
    </div>
  );
};

export default AlbumCard;
