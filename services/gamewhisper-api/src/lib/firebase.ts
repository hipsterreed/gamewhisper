import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { log } from './logger'

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env

if (!getApps().length) {
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    log('warn', 'firebase: missing env vars — Firestore writes and Firebase auth disabled')
  } else {
    // Railway sometimes double-escapes newlines or wraps the value in quotes
    const privateKey = FIREBASE_PRIVATE_KEY
      .replace(/^["']|["']$/g, '')   // strip surrounding quotes if present
      .replace(/\\n/g, '\n')          // literal \n → real newline
      .trim()

    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }
}

export const db = getApps().length ? getFirestore() : null
export const auth = getApps().length ? getAuth() : null
