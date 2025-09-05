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