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


/*
================================================================================
SOLUCIÓN AL PROBLEMA DE DESCARGA DIRECTA (CORS)
================================================================================

--- EL PROBLEMA ---
La funcionalidad de descarga directa en el Lightbox falla y muestra el alert de
"No se pudo iniciar la descarga directa..." porque el navegador bloquea la petición
que el código Javascript (desde galeriaoficial.app) hace para obtener la imagen
desde Firebase Storage (firebasestorage.googleapis.com).

Esto es una medida de seguridad estándar del navegador llamada "Cross-Origin
Resource Sharing" (CORS). El servidor de Storage debe dar permiso explícito
para que otros dominios puedan solicitar sus archivos.

--- LA SOLUCIÓN ---
Debemos aplicar una configuración CORS a nuestro bucket de Firebase Storage para
que confíe en nuestra aplicación web.

--- INSTRUCCIONES (REALIZAR UNA SOLA VEZ) ---

1.  **Abre Google Cloud Shell:**
    a. Ve a tu consola de Google Cloud: https://console.cloud.google.com/
    b. Asegúrate de que estás en el proyecto correcto ("galeriaoficialapp").
    c. Haz clic en el icono "Activar Cloud Shell" en la parte superior derecha
       (parece un ">_"). Se abrirá una terminal en la parte inferior.

2.  **Crea el archivo de configuración:**
    a. En la terminal de Cloud Shell, escribe `touch cors.json` y pulsa Enter.
    b. Luego, escribe `nano cors.json` y pulsa Enter. Se abrirá un editor de texto.
    c. Copia y pega el siguiente contenido EXACTAMENTE dentro del editor:

    [
      {
        "origin": ["https://galeriaoficial.app"],
        "method": ["GET"],
        "maxAgeSeconds": 3600
      }
    ]

    d. Guarda y cierra el editor: pulsa `Ctrl+X`, luego `Y`, y finalmente `Enter`.

3.  **Aplica la configuración al bucket:**
    a. Ejecuta el siguiente comando en la terminal de Cloud Shell. Este comando
       le dice a tu bucket de storage que use las reglas del archivo que acabas de crear.

    gsutil cors set cors.json gs://galeriaoficialapp.appspot.com

    b. Si el comando es exitoso, verás un mensaje como:
       "Setting CORS on gs://galeriaoficialapp.appspot.com/..."

4.  **Espera y prueba:**
    a. Los cambios pueden tardar unos minutos en aplicarse globalmente.
    b. Vuelve a tu aplicación web e intenta descargar una imagen de nuevo.
       La descarga directa debería funcionar sin el alert.

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
INTEGRACIÓN CON WIX (VELO) - HISTORIAL Y SOLUCIÓN FINAL
================================================================================

Se ha completado con éxito la integración del backend para mostrar una galería
pública en un sitio de Wix utilizando Velo.

- **Flujo de Datos:** Cloud Run (`getpublicalbum`) -> Backend de Velo (`galleryAPI.jsw`) -> Frontend de Velo (Página).
  Este flujo de datos se confirmó como 100% operativo desde el inicio.

- **PROBLEMA DETECTADO:** A pesar de que los datos del álbum (incluyendo el array de fotos)
  llegaban correctamente al frontend de Velo, el componente Repetidor (`#galleryRepeater`)
  no renderizaba las imágenes. La consola del navegador finalmente reveló el error clave:
  "Wix code SDK error: Each item in the items array must have a member named `_id` which contains a unique value identifying the item."

- **CAUSA RAÍZ:** Los Repetidores de Velo requieren que cada objeto en el array de datos
  que se les asigna tenga una propiedad **`_id`** (con guion bajo) que actúe como
  identificador único. Nuestra API, siguiendo la convención de Firestore, devolvía
  esta propiedad como `id` (sin guion bajo).

- **SOLUCIÓN FINAL (Implementada en el código de la página de Velo):**
  La solución consiste en transformar el array de fotos recibido de la API antes
  de asignarlo al repetidor. Se utiliza el método `.map()` de Javascript para crear
  un nuevo array donde cada objeto de foto incluye la propiedad `_id` requerida.

  Ejemplo del código de transformación en el frontend de Velo:
  ```javascript
  const photosForRepeater = albumData.photos.map(photo => {
    return {
      ...photo,       // Copia todas las propiedades originales (url, fileName, etc.)
      _id: photo.id  // Añade la propiedad "_id" usando el valor de "id".
    };
  });

  // Finalmente, se asigna el array ya transformado al repetidor:
  $w('#galleryRepeater').data = photosForRepeater;
  ```

- **ESTADO:** Con esta modificación, la integración está completa y la galería
  se muestra correctamente en el sitio de Wix. El problema ha sido resuelto.
*/