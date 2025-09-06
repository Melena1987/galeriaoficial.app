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
- Despliegue: Se ha desplegado utilizando la terminal de Cloud Shell con el siguiente
  comando (o similar), después de crear los archivos index.js y package.json:
  
  gcloud run deploy getpublicalbum --source . --region=europe-west2 --allow-unauthenticated --set-env-vars=GOOGLE_FUNCTION_TARGET=getPublicAlbum
  
- URL del Endpoint: La URL final es generada por Cloud Run al finalizar el despliegue.
  Esa es la URL que debe ser utilizada por el servicio externo (ej: Velo).

Esta aplicación frontend NO consume esta API directamente, ya que tiene acceso
autenticado a Firestore. Esta API es exclusivamente para consumidores externos.
*/
