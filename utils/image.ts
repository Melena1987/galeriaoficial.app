// utils/image.ts

/**
 * Genera una URL de miniatura a partir de una URL de imagen original de Firebase Storage.
 * Asume que la extensión "Resize Images" de Firebase está configurada para crear
 * imágenes con un sufijo (por ejemplo, _400x400).
 * @param originalUrl La URL de la imagen original.
 * @param size El sufijo de tamaño a añadir (ej: '400x400').
 * @returns La URL de la miniatura o la URL original si ocurre un error o si no es una imagen.
 */
export const getThumbnailUrl = (originalUrl?: string, size: string = '400x400'): string => {
  if (!originalUrl) {
    return '';
  }

  // Si parece un video, no intentamos obtener una miniatura generada por nombre,
  // devolvemos la URL original para que la etiqueta <video> la use.
  // Detectar extensiones comunes de video.
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  const lowerUrl = originalUrl.toLowerCase();
  // Comprobamos si la URL (antes de los query params) termina en una extensión de video
  const urlPath = lowerUrl.split('?')[0];
  if (videoExtensions.some(ext => urlPath.endsWith(ext))) {
    return originalUrl;
  }

  try {
    // Dividimos la URL para separar la ruta base de los parámetros de consulta (token, etc.)
    const urlParts = originalUrl.split('?');
    const baseUrl = urlParts[0];
    const queryParams = urlParts.length > 1 ? `?${urlParts[1]}` : '';

    // Buscamos la posición del último punto (extensión) y la última barra en la ruta base.
    const lastDotIndex = baseUrl.lastIndexOf('.');
    const lastSlashIndex = baseUrl.lastIndexOf('/');

    // Nos aseguramos de que el punto que encontramos es parte de una extensión de archivo
    // en el último segmento de la ruta (después de la última barra).
    if (lastDotIndex > lastSlashIndex) {
      const pathWithoutExtension = baseUrl.substring(0, lastDotIndex);
      const extension = baseUrl.substring(lastDotIndex);
      
      // Reconstruimos la URL insertando el sufijo de tamaño antes de la extensión.
      const thumbnailUrl = `${pathWithoutExtension}_${size}${extension}${queryParams}`;
      return thumbnailUrl;
    }

    // Si no se encuentra una extensión de archivo válida, devolvemos la URL original.
    return originalUrl;

  } catch (error) {
    console.error('Error al generar la URL de la miniatura:', error);
    // En caso de cualquier error, es más seguro devolver la URL original.
    return originalUrl;
  }
};