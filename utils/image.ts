// utils/image.ts

/**
 * Genera una URL de miniatura a partir de una URL de imagen original de Firebase Storage.
 * Asume que la extensión "Resize Images" de Firebase está configurada para crear
 * imágenes con un sufijo (por ejemplo, _400x400).
 * @param originalUrl La URL de la imagen original.
 * @param size El sufijo de tamaño a añadir (ej: '400x400').
 * @returns La URL de la miniatura o la URL original si ocurre un error.
 */
export const getThumbnailUrl = (originalUrl?: string, size: string = '400x400'): string => {
  if (!originalUrl) {
    return '';
  }

  try {
    // Las URLs de Firebase Storage se ven así:
    // https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/path%2Fto%2Fimage.jpg?alt=media&token=...
    // Necesitamos insertar el sufijo antes de la extensión del archivo en la parte de la ruta.
    
    const url = new URL(originalUrl);
    const pathName = decodeURIComponent(url.pathname);
    
    const extensionIndex = pathName.lastIndexOf('.');
    if (extensionIndex === -1) {
      // No se encontró extensión, devolver la original.
      return originalUrl;
    }
    
    const basePath = pathName.substring(0, extensionIndex);
    const extension = pathName.substring(extensionIndex);
    
    const newPathName = `${basePath}_${size}${extension}`;
    
    // La ruta en la URL real está codificada, pero las barras ('/') no.
    // Necesitamos reconstruir la URL con la nueva ruta codificada correctamente.
    // Dividimos la ruta original por '/' para codificar cada segmento por separado.
    const pathSegments = newPathName.split('/');
    const encodedPathSegments = pathSegments.map(segment => encodeURIComponent(segment));
    url.pathname = encodedPathSegments.join('/');

    return url.toString();
  } catch (error) {
    console.error('Error al generar la URL de la miniatura:', error);
    // Si algo falla, es más seguro devolver la URL original.
    return originalUrl;
  }
};
