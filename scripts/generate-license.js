/**
 * Gerador de Chaves de Licença Seguras — Lívia Copilot Pro
 * ConectWeb 2026.
 *
 * Uso no terminal:
 *   node scripts/generate-license.js --email "cliente@agencia.com" --plan "agency"
 *   node scripts/generate-license.js --email "solo@empresa.com" --plan "pro"
 */

const crypto = require('crypto');

// Segredo mestre da ConectWeb (NUNCA coloque este segredo dentro da extensão pública!)
const MASTER_SECRET = 'CONECTWEB_LIVIA_PRO_SECURE_SALT_2026_AGENCY';

function generateLicenseKey(email, plan = 'agency') {
  const cleanEmail = email.toLowerCase().trim();
  const cleanPlan = plan.toLowerCase().trim();
  const prefix = cleanPlan === 'agency' ? 'LIVIA-AGY' : 'LIVIA-PRO';

  // Cria um hash HMAC SHA-256 combinando o segredo mestre, e-mail e plano
  const hmac = crypto.createHmac('sha256', MASTER_SECRET);
  hmac.update(`${cleanEmail}:${cleanPlan}`);
  const hash = hmac.digest('hex').toUpperCase();

  // Formata em blocos executivos: LIVIA-AGY-XXXX-XXXX-XXXX
  const p1 = hash.substring(0, 4);
  const p2 = hash.substring(4, 8);
  const p3 = hash.substring(8, 12);

  return `${prefix}-${p1}-${p2}-${p3}`;
}

// Execução via linha de comando
const args = process.argv.slice(2);
let targetEmail = 'cliente@agencia.com';
let targetPlan = 'agency';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) targetEmail = args[i + 1];
  if (args[i] === '--plan' && args[i + 1]) targetPlan = args[i + 1];
}

const key = generateLicenseKey(targetEmail, targetPlan);

console.log('\n======================================================');
console.log('       GERADOR OFICIAL DE LICENÇAS — LÍVIA COPILOT PRO');
console.log('                 ConectWeb Soluções Digitais');
console.log('======================================================\n');
console.log(`👤 Titular / E-mail:  ${targetEmail}`);
console.log(`📦 Plano Adquirido:    ${targetPlan.toUpperCase()}`);
console.log(`🔑 Chave de Licença:   ${key}\n`);
console.log('Instruções para o cliente:');
console.log('1. Abra as Configurações da extensão Lívia Copilot Pro');
console.log('2. Acesse a aba "💎 Licença & Planos"');
console.log(`3. Digite o e-mail "${targetEmail}" e cole a chave "${key}"\n`);
console.log('======================================================\n');
