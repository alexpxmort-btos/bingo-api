import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

let app: App | null = null;
let firestore: Firestore | null = null;

export function initializeFirebase(): void {
  if (app) return;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'dexti-9fec6';

    console.log('🔧 Inicializando Firebase Admin...');
    console.log(`📋 Project ID: ${projectId}`);

    // ✅ OPÇÃO 1 — Arquivo JSON (local / docker)
    if (
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH &&
      fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
    ) {
      const json = JSON.parse(
        fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'),
      );

      app = initializeApp({
        credential: cert(json),
        projectId,
      });

      firestore = getFirestore(app);
      console.log('✅ Firebase inicializado via arquivo');
      return;
    }

    // ✅ OPÇÃO 2 — Variáveis separadas (Render / Railway)
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;

    const privateKey = rawKey
    ?.includes('\\n')
    ? rawKey.replace(/\\n/g, '\n').trim()
    : rawKey?.trim();

    console.log({
      rawLength: rawKey?.length,
      finalLength: privateKey?.length,
      starts: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
      ends: privateKey?.endsWith('-----END PRIVATE KEY-----'),
    });
    
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (privateKey && clientEmail) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });

      firestore = getFirestore(app);
      console.log('✅ Firebase inicializado via ENV');
      return;
    }

    // ❌ Nenhuma configuração encontrada
    throw new Error(
      'Credenciais do Firebase não configuradas (arquivo ou ENV)',
    );
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    throw error;
  }
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    initializeFirebase();
  }

  if (!firestore) {
    throw new Error('Firestore não foi inicializado');
  }

  return firestore;
}
