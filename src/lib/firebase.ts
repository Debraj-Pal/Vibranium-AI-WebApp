import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyBL-flLKwmXVw6lpk0USUl3Ih557MOyv3w",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "stone-ivy-zttsj.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "stone-ivy-zttsj",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "stone-ivy-zttsj.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "349153338672",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:349153338672:web:5c11a623bdb836e27c94f5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (use custom databaseId if configured, or default to system's databaseId if using the default system project)
const customDbId = metaEnv.VITE_FIREBASE_DATABASE_ID;
const isDefaultProject = !metaEnv.VITE_FIREBASE_PROJECT_ID || metaEnv.VITE_FIREBASE_PROJECT_ID === "stone-ivy-zttsj";
const systemDefaultDbId = isDefaultProject ? "ai-studio-e02cd6e0-fb0b-404c-a861-2b79907bb840" : undefined;
const dbId = customDbId !== undefined ? customDbId : systemDefaultDbId;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);
