import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // তোমার আগের configuration থাকবে
  databaseURL: "এখানে-তোমার-আসল-Database-URL",
};

// Initialize Firebase safely preventing duplicate instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Realtime Database instance pointing to asia-southeast1
export const db = getDatabase(app);

export default app;
