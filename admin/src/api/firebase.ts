import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
 const firebaseConfig = {
  // তোমার আগের configuration থাকবে
  databaseURL: "https://gen-lang-client-0048418625-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Initialize Firebase safely preventing duplicate instances
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Realtime Database instance pointing to asia-southeast1
export const db = getDatabase(app);

export default app;
