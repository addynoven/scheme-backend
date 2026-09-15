import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { config } from '../config/config';

/**
 * Singleton Firebase client app initialization.
 * Follows blueprint §5: lightweight client initialization.
 */
function initFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp({
    apiKey: config.firebase.apiKey,
    authDomain: config.firebase.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.storageBucket,
    messagingSenderId: config.firebase.messagingSenderId,
    appId: config.firebase.appId,
  });
}

export const firebaseApp: FirebaseApp = initFirebaseApp();
export const firebaseAuth: Auth = getAuth(firebaseApp);
