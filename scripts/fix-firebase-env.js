/**
 * Script para ajudar a formatar o FIREBASE_SERVICE_ACCOUNT corretamente
 * 
 * Uso:
 * 1. Coloque o arquivo JSON do Firebase na mesma pasta
 * 2. Execute: node scripts/fix-firebase-env.js path/to/service-account.json
 * 3. Copie a saída para o arquivo .env
 */

const fs = require('fs');
const path = require('path');

const jsonPath = process.argv[2];

if (!jsonPath) {
  console.error('❌ Por favor, forneça o caminho do arquivo JSON do Firebase');
  console.log('Uso: node scripts/fix-firebase-env.js path/to/service-account.json');
  process.exit(1);
}

try {
  const jsonContent = fs.readFileSync(jsonPath, 'utf8');
  const jsonData = JSON.parse(jsonContent);
  
  // Validar campos obrigatórios
  if (!jsonData.private_key) {
    throw new Error('private_key não encontrado no JSON');
  }
  if (!jsonData.client_email) {
    throw new Error('client_email não encontrado no JSON');
  }
  if (!jsonData.project_id) {
    throw new Error('project_id não encontrado no JSON');
  }
  
  // Verificar se a chave privada tem o formato correto
  if (!jsonData.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
    console.warn('⚠️ Aviso: Chave privada pode não estar no formato correto');
  }
  
  // Converter para string JSON em uma linha
  const jsonString = JSON.stringify(jsonData);
  
  console.log('\n✅ JSON formatado corretamente!\n');
  console.log('📋 Cole EXATAMENTE isso no seu arquivo .env (sem aspas extras):\n');
  console.log('FIREBASE_SERVICE_ACCOUNT=' + jsonString);
  console.log('\n');
  console.log('📝 Exemplo completo do .env:\n');
  console.log('FIREBASE_PROJECT_ID=' + jsonData.project_id);
  console.log('FIREBASE_SERVICE_ACCOUNT=' + jsonString);
  console.log('\n');
  console.log('✅ Pronto! Copie e cole no arquivo .env\n');
  
} catch (error) {
  console.error('❌ Erro ao processar arquivo:', error.message);
  if (error.code === 'ENOENT') {
    console.error('   Arquivo não encontrado:', jsonPath);
  }
  process.exit(1);
}

