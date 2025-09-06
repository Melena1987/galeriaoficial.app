import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src?: string; // src es ahora opcional para mayor robustez
  alt: string;
  className: string;
  placeholderClassName?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholderClassName = 'bg-slate-800' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Si no hay src, no hay nada que observar o cargar.
    if (!src) return;

    // Capturamos el nodo actual. Esto es clave porque ref.current puede cambiar.
    const node = ref.current;
    if (!node) return;

    // Creamos el observador de intersección.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Cuando el placeholder es visible, actualizamos el estado para cargar la imagen.
        if (entry.isIntersecting) {
          setIsLoaded(true);
          // Una vez que lo hemos visto, ya no necesitamos observar este nodo.
          observer.unobserve(node);
        }
      },
      {
        rootMargin: '100px 0px', // Empezar a cargar imágenes 100px antes de que entren en el viewport.
      }
    );

    // Empezamos a observar el elemento placeholder.
    observer.observe(node);

    // La función de limpieza se asegura de dejar de observar si el componente se desmonta.
    return () => {
      observer.unobserve(node);
    };
  }, [src]); // El efecto se vuelve a ejecutar si la URL de la imagen (src) cambia.

  // Si aún no hemos detectado que la imagen está visible o si no hay 'src',
  // mostramos el 'div' que actúa como placeholder. La ref se adjunta aquí.
  if (!isLoaded || !src) {
    return <div ref={ref} className={`${className} ${placeholderClassName}`} aria-label={alt} />;
  }

  // Una vez que isLoaded es true, renderizamos la etiqueta <img> real.
  // El navegador se encargará de descargar y mostrar la imagen.
  return <img src={src} alt={alt} className={className} decoding="async" />;
};

export default LazyImage;
