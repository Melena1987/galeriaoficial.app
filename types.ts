import firebase from 'firebase/compat/app';

export interface Album {
  id: string;
  name: string;
  description: string;
  createdAt: firebase.firestore.Timestamp;
  userId: string;
  coverPhotoUrl?: string;
}

export interface Photo {
  id: string;
  albumId: string;
  url: string;
  fileName: string;
  createdAt: firebase.firestore.Timestamp;
  userId: string;
}
