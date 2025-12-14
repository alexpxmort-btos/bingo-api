import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initializeFirebase } from './firebase/firebase.config';

async function bootstrap() {
  // Inicializar Firebase se configurado
  if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID) {
    try {
      initializeFirebase();
    } catch (error) {
      console.warn('⚠️ Firebase não inicializado, usando repositório em memória');
    }
  }

  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`\n🚀 Backend rodando na porta ${port}`);
  const persistence = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_PROJECT_ID 
    ? '✅ Cloud Firestore (dados persistentes)' 
    : '⚠️ Memória (dados temporários)';
  console.log(`📦 Persistência: ${persistence}\n`);
}

bootstrap();

