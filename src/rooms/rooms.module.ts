import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { AppGateway } from '../app.gateway';
import { InMemoryRoomRepository } from './repositories/in-memory-room.repository';
import { FirestoreRoomRepository } from './repositories/firestore-room.repository';
import { initializeFirebase } from '../firebase/firebase.config';
import * as fs from 'fs';
import * as path from 'path';

function getRepositoryClass() {
  // Verificar todas as opções de configuração do Firebase
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasServiceAccountPath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;
  
  // Verificar se existe arquivo mesmo sem variável
  const defaultServiceAccountPath = path.join(process.cwd(), 'service-account.json');
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || defaultServiceAccountPath;
  const hasServiceAccountFile = fs.existsSync(serviceAccountPath);
  
  const useFirestore = hasServiceAccount || hasServiceAccountPath || hasServiceAccountFile || hasProjectId;
  
  console.log('\n🔍 Verificando configuração de persistência...');
  console.log(`   FIREBASE_PROJECT_ID: ${hasProjectId ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   FIREBASE_SERVICE_ACCOUNT (variável): ${hasServiceAccount ? '✅ Configurado' : '❌ Não configurado'}`);
  console.log(`   FIREBASE_SERVICE_ACCOUNT_PATH: ${hasServiceAccountPath ? `✅ ${serviceAccountPath}` : '❌ Não configurado'}`);
  console.log(`   Arquivo service-account.json: ${hasServiceAccountFile ? `✅ Encontrado em ${serviceAccountPath}` : '❌ Não encontrado'}`);
  
  if (useFirestore) {
    try {
      initializeFirebase();
      console.log('📦 ✅ Usando Cloud Firestore para persistência');
      console.log('   ✅ Os dados serão salvos permanentemente no Firebase');
      console.log('   ✅ Dados persistem mesmo após reiniciar o servidor\n');
      return FirestoreRoomRepository;
    } catch (error: any) {
      console.error('❌ Erro ao inicializar Firebase:', error.message);
      console.error('   Stack:', error.stack);
      console.warn('⚠️ Usando repositório em memória como fallback');
      console.warn('   ⚠️ ATENÇÃO: Dados serão perdidos ao reiniciar o servidor!');
      console.warn('   💡 Verifique a configuração do Firebase no arquivo .env\n');
      return InMemoryRoomRepository;
    }
  }
  
  console.log('📦 ⚠️ Usando repositório em memória (Firebase não configurado)');
  console.log('   ⚠️ ATENÇÃO: Dados serão perdidos ao reiniciar o servidor!');
  console.log('   ⚠️ A persistência DEVE usar Cloud Firestore!');
  console.log('   💡 Configure uma das opções:');
  console.log('      - FIREBASE_SERVICE_ACCOUNT_PATH=service-account.json (RECOMENDADO)');
  console.log('      - FIREBASE_SERVICE_ACCOUNT={...} (JSON em uma linha)');
  console.log('      - Coloque service-account.json na pasta do backend');
  console.log('   📖 Veja FIREBASE_SETUP.md para instruções detalhadas\n');
  return InMemoryRoomRepository;
}

@Module({
  controllers: [RoomsController],
  providers: [
    RoomsService,
    AppGateway,
    {
      provide: 'IRoomRepository',
      useFactory: () => {
        // Usar useFactory para garantir que seja executado após ConfigModule carregar
        return new (getRepositoryClass())();
      },
    },
  ],
  exports: [
    RoomsService,
    'IRoomRepository',
  ],
})
export class RoomsModule {}

