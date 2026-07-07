import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

export type { Unsubscribe };
export { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy };

/* ── Hardcoded Firebase web config ──────────────────────────────────────── */
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC4KQn44OX8VUj22cnU9_LCXoM5jt10CdM",
  authDomain:        "pita-pit2.firebaseapp.com",
  projectId:         "pita-pit2",
  storageBucket:     "pita-pit2.firebasestorage.app",
  messagingSenderId: "305833156779",
  appId:             "1:305833156779:web:ae5c5867c8240d12f8d7ee",
};

/* ── Singleton Firestore instance ───────────────────────────────────────── */
let _app: FirebaseApp | null = null;
let _db:  Firestore | null   = null;

export function getDb(): Firestore {
  if (!_db) {
    const existing = getApps();
    _app = existing.length ? existing[0] : initializeApp(FIREBASE_CONFIG);
    _db  = getFirestore(_app);
  }
  return _db;
}

export function isFirebaseReady() { return true; }
