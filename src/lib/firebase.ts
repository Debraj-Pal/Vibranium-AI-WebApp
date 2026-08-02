import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import fileConfig from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const currentProjectId = metaEnv.VITE_FIREBASE_PROJECT_ID || fileConfig.projectId || "vibranium-web-app";
const isDefaultProject = currentProjectId === "stone-ivy-zttsj";

const defaultFirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || fileConfig.apiKey || (isDefaultProject ? "AIzaSyBL-flLKwmXVw6lpk0USUl3Ih557MOyv3w" : "AIzaSyB4p4Gi530QV2hwIH3qfiHgBEp8yOk3Lpc"),
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || fileConfig.authDomain || (isDefaultProject ? "stone-ivy-zttsj.firebaseapp.com" : "vibranium-web-app.firebaseapp.com"),
  projectId: currentProjectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || fileConfig.storageBucket || (isDefaultProject ? "stone-ivy-zttsj.firebasestorage.app" : "vibranium-web-app.firebasestorage.app"),
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || fileConfig.messagingSenderId || (isDefaultProject ? "349153338672" : "982250496279"),
  appId: metaEnv.VITE_FIREBASE_APP_ID || fileConfig.appId || (isDefaultProject ? "1:349153338672:web:5c11a623bdb836e27c94f5" : "1:982250496279:web:75e930e0e3220898abd752")
};

// Default Firestore configuration
const customDbId = metaEnv.VITE_FIREBASE_DATABASE_ID;
const systemDefaultDbId = isDefaultProject ? "ai-studio-e02cd6e0-fb0b-404c-a861-2b79907bb840" : (fileConfig.firestoreDatabaseId || undefined);
const defaultDbId = customDbId !== undefined ? customDbId : systemDefaultDbId;

// Initialize statically with default configurations first to prevent load-time errors
let appInstance = initializeApp(defaultFirebaseConfig);
export let db = defaultDbId ? getFirestore(appInstance, defaultDbId) : getFirestore(appInstance);
export let auth = getAuth(appInstance);

// Runtime helper to update/re-initialize Firebase configuration dynamically
export async function initFirebaseWithConfig(config: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId?: string;
}) {
  try {
    const apps = getApps();
    if (apps.length > 0) {
      await Promise.all(apps.map(app => deleteApp(app)));
    }
    appInstance = initializeApp(config);
    db = config.databaseId ? getFirestore(appInstance, config.databaseId) : getFirestore(appInstance);
    auth = getAuth(appInstance);
    console.log("[Firebase] Successfully initialized with dynamic runtime config for project:", config.projectId);
  } catch (err) {
    console.error("[Firebase] Error re-initializing with dynamic config:", err);
  }
}

