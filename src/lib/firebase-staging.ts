import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import stagingConfig from '../../firebase-staging-config.json';

/**
 * Isolated Staging Firebase Initialization
 * Uses named app instance 'staging' to prevent any conflict or overlap with production default app.
 */
const STAGING_APP_NAME = 'staging';

// Safe configuration with placeholder if apiKey is empty, preventing auth/invalid-api-key crash on startup
const safeStagingConfig = {
  ...stagingConfig,
  apiKey: stagingConfig.apiKey && stagingConfig.apiKey.trim() !== '' 
    ? stagingConfig.apiKey 
    : 'AIzaSyStagingKeyPlaceholder00000000000000'
};

let stagingAppInstance: FirebaseApp;
let stagingDbInstance: Firestore;
let stagingAuthInstance: Auth;

try {
  stagingAppInstance = getApps().some(a => a.name === STAGING_APP_NAME)
    ? getApp(STAGING_APP_NAME)
    : initializeApp(safeStagingConfig, STAGING_APP_NAME);

  stagingDbInstance = getFirestore(stagingAppInstance, stagingConfig.firestoreDatabaseId || '(default)');
  stagingAuthInstance = getAuth(stagingAppInstance);
} catch (error) {
  console.warn('Staging Firebase initialization notice (lazy fallback active):', error);
  // Fallback dummy instance if needed
  stagingAppInstance = getApps().find(a => a.name === STAGING_APP_NAME) || initializeApp(safeStagingConfig, STAGING_APP_NAME);
  stagingDbInstance = getFirestore(stagingAppInstance);
  stagingAuthInstance = getAuth(stagingAppInstance);
}

export const stagingApp = stagingAppInstance;
export const stagingDb = stagingDbInstance;
export const stagingAuth = stagingAuthInstance;
