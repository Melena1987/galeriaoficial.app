// FIX: Use Firebase v8 compat imports for types.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

export interface Album {
  id: string;
  nombre: string;
  imagenURL: string;
  // FIX: Use firebase.firestore.Timestamp for v8 compatibility.
  createdAt: firebase.firestore.Timestamp;
}