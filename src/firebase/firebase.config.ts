import { initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let app: App | null = null;
let firestore: Firestore | null = null;

export function initializeFirebase(): void {
  if (app) {
    return; // Já inicializado
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'dexti-9fec6';
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    console.log('🔧 Inicializando Firebase Admin...');
    console.log(`📋 Project ID: ${projectId}`);
    
    // OPÇÃO 1: Tentar carregar de arquivo (MAIS FÁCIL E RECOMENDADO)
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      try {
        console.log(`📁 Carregando Service Account de arquivo: ${serviceAccountPath}`);
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
      } catch (error: any) {
        console.error('❌ Erro ao carregar arquivo:', error.message);
        throw error;
      }
    }
    
    // OPÇÃO 2: Tentar carregar de variável de ambiente
    console.log(`🔑 Service Account: ${serviceAccount ? 'Configurado (variável)' : 'Não configurado'}`);
    
    if (serviceAccount) {
      // Se tiver service account JSON, usar ele
      try {
        // Parse do JSON
        let serviceAccountJson: any;
        
        // Tentar parse direto primeiro
        try {
          serviceAccountJson = JSON.parse(
            serviceAccount.replace(/\\n/g, '\n'),
          );
        } catch (parseError: any) {
          console.warn('⚠️ Erro ao fazer parse direto do JSON. Tentando corrigir...');
          
          // Remover possíveis espaços extras no início/fim
          let cleaned = serviceAccount.trim();
          
          // Se começar com aspas, remover
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
            // Desescapar aspas duplas
            cleaned = cleaned.replace(/\\"/g, '"');
          }
          
          // Tentar parse novamente
          try {
            serviceAccountJson = JSON.parse(cleaned);
          } catch (e: any) {
            console.error('❌ Erro detalhado:', e.message);
            console.error('   Primeiros 200 caracteres:', cleaned.substring(0, 200));
            throw new Error(`Erro ao parsear JSON: ${parseError.message}. Verifique se o JSON está completo e em uma única linha.`);
          }
        }
        
        // Validar campos obrigatórios
        if (!serviceAccountJson.private_key) {
          throw new Error('Chave privada não encontrada no JSON');
        }
        
        if (!serviceAccountJson.client_email) {
          throw new Error('client_email não encontrado no JSON');
        }
        
        // Garantir que a chave privada tem as quebras de linha corretas
        // A chave privada deve ter \n (quebra de linha real) não \\n (string)
        let privateKey = serviceAccountJson.private_key;
        
        // Se a chave privada tem \\n (duas barras como string), converter para \n (quebra real)
        if (privateKey.includes('\\\\n')) {
          privateKey = privateKey.replace(/\\\\n/g, '\n');
        }
        // Se tem \n como string literal (após JSON.parse), já está correto
        // Mas verificar se realmente tem quebras de linha
        if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
          // Substituir \n literal por quebra de linha real
          privateKey = privateKey.replace(/\\n/g, '\n');
        }
        
        // Verificar formato PEM
        if (!privateKey.includes('-----BEGIN')) {
          throw new Error('Chave privada inválida: não contém -----BEGIN PRIVATE KEY-----');
        }
        if (!privateKey.includes('-----END')) {
          throw new Error('Chave privada inválida: não contém -----END PRIVATE KEY-----');
        }
        
        // Atualizar a chave privada corrigida
        serviceAccountJson.private_key = privateKey;
        
        // Tentar inicializar
        app = initializeApp({
          credential: cert(serviceAccountJson),
          projectId: projectId,
        });
        console.log('✅ Firebase Admin inicializado com Service Account');
      } catch (parseError: any) {
        console.error('❌ Erro ao fazer parse do FIREBASE_SERVICE_ACCOUNT:', parseError.message);
        console.error('   Stack:', parseError.stack);
        console.error('\n   💡 Dicas para corrigir:');
        console.error('   1. Use o script: node scripts/fix-firebase-env.js service-account.json');
        console.error('   2. Ou no Node.js: console.log(JSON.stringify(require("./service-account.json")))');
        console.error('   3. Certifique-se de que o JSON está em UMA ÚNICA LINHA no .env');
        console.error('   4. Não adicione aspas extras ao redor do JSON no .env\n');
        throw parseError;
      }
    } else if (projectId) {
      // Usar Application Default Credentials (para produção/cloud)
      app = initializeApp({
        projectId: projectId,
      });
      console.log('✅ Firebase Admin inicializado com Application Default Credentials');
    } else {
      throw new Error('FIREBASE_PROJECT_ID ou FIREBASE_SERVICE_ACCOUNT deve ser configurado');
    }

    firestore = getFirestore(app);
    console.log('✅ Cloud Firestore inicializado com sucesso');
    console.log(`   📍 Projeto: ${projectId}`);
    console.log(`   📦 Coleção: rooms`);
  } catch (error: any) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  }
}

export function getFirestoreInstance(): Firestore {
  if (!firestore) {
    initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore não foi inicializado');
    }
  }
  return firestore;
}

