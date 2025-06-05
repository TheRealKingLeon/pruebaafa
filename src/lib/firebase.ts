
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let initializationError: string | null = null;
let configForDebugging: any = {};

try {
  console.log("[Firebase Init] Attempting Firebase initialization...");
  configForDebugging = { ...firebaseConfig }; // Capture config for debugging

  // Check for essential config values
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    const missingKeys = [];
    if (!firebaseConfig.apiKey) missingKeys.push('apiKey');
    if (!firebaseConfig.projectId) missingKeys.push('projectId');
    initializationError = `Firebase Init Error: Missing essential config values: ${missingKeys.join(', ')}. Check .env.local.`;
    console.error(initializationError);
    // Do not throw here, let getFirebaseDebugInfo report it
  } else {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("[Firebase Init] Firebase app initialized with name:", app.name);
    } else {
      app = getApp();
      console.log("[Firebase Init] Existing Firebase app retrieved:", app.name);
    }
    
    if (app) {
      db = getFirestore(app);
      if (db && typeof db.INTERNAL !== 'undefined') { // Basic check for valid Firestore instance
        console.log("[Firebase Init] Firestore db instance successfully obtained.");
      } else {
        initializationError = "[Firebase Init Error] Failed to obtain a valid Firestore db instance after app initialization.";
        console.error(initializationError);
        db = undefined; // Ensure db is undefined if not valid
      }
    } else {
      initializationError = "[Firebase Init Error] Firebase app could not be initialized or retrieved.";
      console.error(initializationError);
    }
  }
} catch (error) {
  initializationError = `[Firebase Init Exception] ${error instanceof Error ? error.message : String(error)}`;
  console.error(initializationError, error);
  app = undefined;
  db = undefined;
}

export function getFirebaseDebugInfo() {
  return {
    configUsed: configForDebugging,
    isDbInitialized: !!db && typeof db?.INTERNAL !== 'undefined',
    appName: app?.name,
    error: initializationError,
    envKeys: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Loaded' : 'MISSING_OR_UNDEFINED',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Loaded' : 'MISSING_OR_UNDEFINED',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Loaded' : 'MISSING_OR_UNDEFINED',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? 'Loaded' : 'MISSING_OR_UNDEFINED',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? 'Loaded' : 'MISSING_OR_UNDEFINED',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? 'Loaded' : 'MISSING_OR_UNDEFINED',
    }
  };
}

export { db };
