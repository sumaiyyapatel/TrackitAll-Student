import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC2a7rhtfWOZZG8u6iDkNl14q-LHGXPLGA",
  authDomain: "inkspace711.firebaseapp.com",
  databaseURL: "https://inkspace711-default-rtdb.firebaseio.com",
  projectId: "inkspace711",
  storageBucket: "inkspace711.firebasestorage.app",
  messagingSenderId: "907161342594",
  appId: "1:907161342594:web:dea214c361207358ba9a9b",
  measurementId: "G-T3YJZFFZQG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;