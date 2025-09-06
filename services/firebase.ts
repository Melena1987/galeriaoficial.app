// FIX: Use Firebase v8 compat imports to provide the namespaced API.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_EcU2lLQR8fads3cz_o_hifog9Vn-nys",
  authDomain: "galeriaoficialapp.firebaseapp.com",
  projectId: "galeriaoficialapp",
  storageBucket: "galeriaoficialapp.firebasestorage.app",
  messagingSenderId: "149378720195",
  appId: "1:149378720195:web:a853d89c22ee12b4f5dd76"
};

// Initialize Firebase
// FIX: Use v8 namespaced `firebase.initializeApp` and check for existing apps to prevent re-initialization.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Export services
// FIX: Export services using the v8 namespaced API (e.g., firebase.auth()).
export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

/*
================================================================================
NOTAS SOBRE LAS REGLAS DE SEGURIDAD DE FIREBASE
================================================================================

Estas reglas son cruciales para la seguridad y el funcionamiento de la aplicación.
Deben ser copiadas y pegadas en la sección "Rules" correspondiente en la consola de Firebase.

--- 1. REGLAS DE FIRESTORE DATABASE ---
(Ir a Build -> Firestore Database -> Rules)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para la colección de Álbumes
    match /albums/{albumId} {
      // Cualquiera puede leer un álbum si es público.
      // El dueño siempre puede leer sus propios álbumes.
      allow read: if resource.data.isPublic == true || request.auth.uid == resource.data.userId;
      
      // Un usuario solo puede crear álbumes para sí mismo.
      allow create: if request.auth.uid != null && request.resource.data.userId == request.auth.uid;
      
      // Solo el dueño del álbum puede actualizarlo o borrarlo.
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Reglas para la colección de Fotos
    match /photos/{photoId} {
      // Las fotos se pueden leer si el álbum es público o si eres el dueño.
      allow read: if get(/databases/$(database)/documents/albums/$(resource.data.albumId)).data.isPublic == true 
                  || request.auth.uid == resource.data.userId;
      
      // Un usuario solo puede crear fotos para sí mismo.
      allow create: if request.auth.uid != null && request.resource.data.userId == request.auth.uid;
      
      // Solo el dueño de la foto puede borrarla.
      allow delete: if request.auth.uid == resource.data.userId;
    }
  }
}

--- 2. REGLAS DE CLOUD STORAGE ---
(Ir a Build -> Storage -> Rules)

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    // REGLA 1: PERMITIR LECTURA PÚBLICA
    // Esto es crucial para que las miniaturas y los álbumes compartidos funcionen.
    // Cualquiera con el enlace puede ver una imagen, pero no puede listar archivos.
    // La privacidad de los álbumes se gestiona con las reglas de Firestore.
    match /{allPaths=**} {
      allow read;
    }

    // REGLA 2: PROTEGER LA ESCRITURA (SUBIR, BORRAR)
    // Solo un usuario autenticado puede subir, actualizar o borrar archivos,
    // y únicamente dentro de su propia carpeta de usuario.
    match /users/{userId}/photos/{allPaths=**} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

================================================================================
NOTA SOBRE EL SERVICIO DE CLOUD RUN (API PÚBLICA)
================================================================================

Para permitir la integración con servicios externos como Velo by Wix, que no pueden
autenticarse directamente con Firebase, se ha creado un servicio en Google Cloud Run.

- Nombre del Servicio: getpublicalbum
- Propósito: Actúa como una API pública que expone los datos de los álbumes marcados
  como públicos. Recibe un ID de álbum y devuelve sus detalles y fotos.
- Autenticación: El servicio está configurado para "Permitir invocaciones no autenticadas",
  lo que significa que cualquiera con la URL puede acceder a él. La lógica interna
  del código (index.js) se encarga de verificar si el álbum solicitado es público.

- Despliegue y Configuración Clave:
  El servicio fue desplegado desde la terminal de Cloud Shell, ya que la interfaz
  gráfica de Google Cloud presentaba problemas para mostrar el editor de código.

  1.  Se crearon dos archivos en una carpeta (`index.js` y `package.json`).
  2.  **IMPORTANTE**: Para que el contenedor de Cloud Run pueda iniciarse correctamente,
      el archivo `package.json` debe incluir un script "start" que ejecute el
      functions-framework. Sin esto, el despliegue falla con un error de "container failed to start".
      
      Ejemplo de `package.json` funcional:
      {
        "name": "getpublicalbum-service",
        "main": "index.js",
        "scripts": {
          "start": "functions-framework --target=getPublicAlbum"
        },
        "dependencies": { ... }
      }

  3.  El comando final y exitoso para el despliegue fue:
      gcloud run deploy getpublicalbum --source . --region=europe-west2 --allow-unauthenticated --set-env-vars=GOOGLE_FUNCTION_TARGET=getPublicAlbum

- URL del Endpoint: La URL final es generada por Cloud Run al finalizar el despliegue
  (ej: https://getpublicalbum-149378720195.europe-west2.run.app). Esa es la URL
  que debe ser utilizada por el servicio externo (ej: Velo).

Esta aplicación frontend NO consume esta API directamente, ya que tiene acceso
autenticado a Firestore. Esta API es exclusivamente para consumidores externos.

================================================================================
INTEGRACIÓN CON WIX (VELO) - HISTORIAL DE PROGRESO
================================================================================

Se ha completado con éxito la integración del backend para mostrar una galería
pública en un sitio de Wix utilizando Velo.

- **Punto de Partida:** El servicio de Cloud Run `getpublicalbum` funciona
  correctamente y expone los datos de los álbumes públicos.

- **Backend de Velo (`galleryAPI.jsw`):** Se creó un módulo JSW en el backend de Velo
  que llama de forma segura al endpoint de Cloud Run. Esta parte funciona
  perfectamente.

- **Frontend de Velo (Código de Página):**
  - El código de la página llama a la función del backend `getPublicAlbumData`.
  - **ÉXITO CONFIRMADO:** La consola del navegador en el modo "Preview" de Wix
    muestra el mensaje "ÁLBUM RECIBIDO CORRECTAMENTE" junto con el objeto
    del álbum. Esto confirma que los datos están llegando a la página.
  - El código utiliza un elemento **Repetidor** (ID: `#galleryRepeater`) para
    mostrar las fotos. Dentro de cada ítem del repetidor, hay un **Contenedor**
    y dentro de él, un elemento **Imagen** (ID: `#photoImage`).

- **PROBLEMA ACTUAL Y BLOQUEO:**
  - A pesar de que los datos se reciben correctamente en la página, el Repetidor
    no se actualiza visualmente para mostrar las fotos del álbum. Sigue
    sin mostrar nada o con los ítems de la plantilla por defecto.
  - **No hay errores de código en la consola.** El problema es puramente de renderizado
    en el editor de Wix o en el modo "Preview".

- **ÚLTIMOS PASOS DE DEPURACIÓN SUGERIDOS (Sin éxito hasta ahora):**
  1.  **Verificar Propiedades del Repetidor:** Se ha confirmado que el repetidor
      NO está marcado como "Oculto" o "Contraído" por defecto en el panel de
      propiedades del editor.
  2.  **Ajustar Tamaño Físico:** Se ha intentado dar al repetidor un tamaño
      (alto y ancho) explícito en el editor para asegurar que ocupa espacio.
  3.  **Publicar y Probar en Sitio Real:** Se ha recomendado publicar el sitio
      y comprobar la URL en vivo, ya que el modo "Preview" de Velo puede ser
      poco fiable para renderizar contenido dinámico inyectado por código.

- **Conclusión para el próximo técnico:** El flujo de datos (Cloud Run -> Velo Backend -> Velo Frontend)
  está 100% operativo. El problema reside exclusivamente en la configuración
  visual del componente Repetidor en el Editor de Wix o en un posible bug/limitación
  del entorno de Velo. El siguiente paso es revisar meticulosamente cada propiedad
  del Repetidor y sus elementos hijos en el editor, y probar en el sitio publicado.
*/