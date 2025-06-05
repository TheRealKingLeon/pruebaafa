
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
let configForDebugging: any = {}; // To store the config used during initialization attempt

console.log("[Firebase Init] Starting Firebase initialization process...");

try {
  configForDebugging = { // Capture config for debugging
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    // Do NOT log sensitive parts of storageBucket, messagingSenderId, appId unless necessary for deep debugging
    // and ensure they are not committed. For now, confirming apiKey and projectId is key.
  };
  console.log("[Firebase Init] Config values being used (partial):", JSON.stringify(configForDebugging));


  // Check for essential config values
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('apiKey');
  if (!firebaseConfig.projectId) missingKeys.push('projectId');

  if (missingKeys.length > 0) {
    initializationError = `Firebase Init Error: Missing essential config values: ${missingKeys.join(', ')}. Check .env.local and ensure the server was restarted.`;
    console.error(initializationError);
    // Do not throw here, let getFirebaseDebugInfo report it and actions handle it
  } else {
    console.log("[Firebase Init] Essential config values (apiKey, projectId) seem to be present.");
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("[Firebase Init] Firebase app initialized with name:", app.name);
    } else {
      app = getApp();
      console.log("[Firebase Init] Existing Firebase app retrieved:", app.name);
    }
    
    if (app) {
      console.log("[Firebase Init] Attempting to get Firestore instance...");
      db = getFirestore(app);
      if (db) { // Simplified check: if getFirestore returns a truthy value
        console.log("[Firebase Init] Firestore db instance successfully obtained.");
      } else {
        initializationError = "[Firebase Init Error] getFirestore(app) returned a falsy value (e.g. undefined or null).";
        console.error(initializationError);
        db = undefined; // Ensure db is undefined
      }
    } else {
      initializationError = "[Firebase Init Error] Firebase app could not be initialized or retrieved (app object is undefined).";
      console.error(initializationError);
    }
  }
} catch (error) {
  initializationError = `[Firebase Init Catch Block Exception] ${error instanceof Error ? error.message : String(error)}`;
  console.error(initializationError, error); // Log the actual error object too
  app = undefined;
  db = undefined;
}

export function getFirebaseDebugInfo() {
  const envKeysStatus: Record<string, string> = {};
  const keysToCensorForLog = ['apiKey', 'appId', 'messagingSenderId']; // Censor these in debug output for safety

  for (const key in firebaseConfig) {
    const envVarName = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    const value = process.env[envVarName];
    if (keysToCensorForLog.includes(key) && value) {
      envKeysStatus[envVarName] = 'Loaded (censored)';
    } else {
      envKeysStatus[envVarName] = value ? 'Loaded' : 'MISSING_OR_UNDEFINED';
    }
  }
  
  const configUsedForDisplay: any = {};
   for (const key in configForDebugging) {
    if (keysToCensorForLog.includes(key) && configForDebugging[key]) {
      configUsedForDisplay[key] = '******';
    } else {
      configUsedForDisplay[key] = configForDebugging[key];
    }
  }

  return {
    configUsed: configUsedForDisplay,
    isDbInitialized: !!db, // Simplified check
    appName: app?.name,
    error: initializationError,
    envKeys: envKeysStatus,
  };
}

export { db };
