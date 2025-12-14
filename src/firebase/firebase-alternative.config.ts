/**
 * Configuração alternativa do Firebase que permite usar arquivo JSON
 * ao invés de variável de ambiente
 */

import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let app: App | null = null;
let firestore: Firestore | null = null;

export function initializeFirebaseFromFile(): void {
  if (app) {
    return; // Já inicializado
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'dexti-9fec6';
    
    // Tentar carregar de arquivo primeiro
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
      path.join(process.cwd(), 'service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      console.log('📁 Carregando Service Account de arquivo:', serviceAccountPath);
      const serviceAccountJson = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      app = initializeApp({
        credential: cert(serviceAccountJson),
        projectId: projectId,
      });
      
      firestore = getFirestore(app);
      console.log('✅ Firebase Admin inicializado com Service Account (arquivo)');
      console.log(`   📍 Projeto: ${projectId}`);
      console.log(`   📦 Coleção: rooms`);
      return;
    }
    
    // Se não encontrou arquivo, tentar variável de ambiente
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccount) {
      console.log('📋 Carregando Service Account de variável de ambiente');
      // ... código existente
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Firebase:', error.message);
    throw error;
  }
}

