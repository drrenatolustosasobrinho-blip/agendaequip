#!/usr/bin/env node

/**
 * Script para inicializar o admin no backend Supabase
 * Uso: node scripts/bootstrap-admin.js <adminEmail> <adminPassword>
 *
 * Requisitos:
 * - Variáveis de ambiente carregadas (.env.local)
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (opcional)
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BOOTSTRAP_PASSWORD (obrigatórias)
 */

require('dotenv').config({ path: '../.env.local' });

async function bootstrap(adminEmail, adminPassword) {
  const bootstrapPassword = process.env.BOOTSTRAP_PASSWORD;
  const apiUrl = `${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL}/functions/v1/bootstrap-admin`;

  if (!bootstrapPassword) {
    console.error('❌ BOOTSTRAP_PASSWORD não definida no .env.local');
    process.exit(1);
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bootstrapPassword,
        adminEmail,
        adminPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro:', data.error || response.statusText);
      process.exit(1);
    }

    console.log('✅ Admin criado com sucesso!');
    console.log('📧 Email:', adminEmail);
    console.log('🔗 URL:', process.env.VITE_SUPABASE_URL);
  } catch (err) {
    console.error('❌ Erro na requisição:', err.message);
    process.exit(1);
  }
}

const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/bootstrap-admin.js <email> <senha>');
  process.exit(1);
}

bootstrap(email, password);
