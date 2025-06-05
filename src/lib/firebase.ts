
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
console.log(`[Firebase Init] Raw apiKey from process.env: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0,5) + '...' : 'UNDEFINED'}`);
console.log(`[Firebase Init] Raw projectId from process.env: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);

try {
  // Log the firebaseConfig object that will be used by initializeApp
  console.log("[Firebase Init] firebaseConfig object before initializeApp:", JSON.stringify({
    apiKey: firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0,5) + '...' : "UNDEFINED", // Censor if present
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId ? firebaseConfig.messagingSenderId.substring(0,5) + '...' : "UNDEFINED", // Censor if present
    appId: firebaseConfig.appId ? firebaseConfig.appId.substring(0,5) + '...' : "UNDEFINED" // Censor if present
  }));

  configForDebugging = { // Capture config for debugging
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
  };
  
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('apiKey');
  if (!firebaseConfig.projectId) missingKeys.push('projectId');

  if (missingKeys.length > 0) {
    initializationError = `Firebase Init Error: Missing essential config values from firebaseConfig object: ${missingKeys.join(', ')}. Check Vercel env vars & redeploy. Ensure they are available at runtime.`;
    console.error(initializationError);
  } else {
    console.log("[Firebase Init] Essential config values (apiKey, projectId) seem to be present in firebaseConfig object.");
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
      if (db) { 
        console.log("[Firebase Init] Firestore db instance successfully obtained.");
      } else {
        initializationError = "[Firebase Init Error] getFirestore(app) returned a falsy value (e.g. undefined or null).";
        console.error(initializationError);
        db = undefined; 
      }
    } else {
      initializationError = "[Firebase Init Error] Firebase app could not be initialized or retrieved (app object is undefined).";
      console.error(initializationError);
    }
  }
} catch (error) {
  initializationError = `[Firebase Init Catch Block Exception] ${error instanceof Error ? error.message : String(error)}`;
  console.error(initializationError, error); 
  app = undefined;
  db = undefined;
}

export function getFirebaseDebugInfo() {
  const envKeysStatus: Record<string, string> = {};
  const keysToCensorForLog = ['apiKey', 'appId', 'messagingSenderId']; 

  // Check current process.env values at the time this function is called
  const currentEnvValues: Record<string, string | undefined> = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  for (const key in firebaseConfig) {
    const envVarName = `NEXT_PUBLIC_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    const value = currentEnvValues[envVarName]; // Use the re-checked value
    if (keysToCensorForLog.includes(key) && value) {
      envKeysStatus[envVarName] = `Loaded (censored: ${value.substring(0,5)}...)`;
    } else {
      envKeysStatus[envVarName] = value ? `Loaded: ${value}` : 'MISSING_OR_UNDEFINED_AT_RUNTIME';
    }
  }
  
  const configUsedForDisplay: any = {};
   for (const key in configForDebugging) { // configForDebugging uses values from module load time
    if (keysToCensorForLog.includes(key) && configForDebugging[key]) {
      configUsedForDisplay[key] = '******';
    } else {
      configUsedForDisplay[key] = configForDebugging[key] || 'NOT_SET_AT_MODULE_LOAD';
    }
  }

  return {
    configUsedAtModuleLoad: configUsedForDisplay,
    isDbInitialized: !!db,
    appName: app?.name,
    initializationErrorDetected: initializationError,
    runtimeEnvVarStatus: envKeysStatus,
  };
}

export { db };
