const crypto = require('crypto');

const secrets = {
  API_SECRET_KEY: crypto.randomBytes(32).toString('hex'),
  WEBHOOK_HMAC_SECRET: crypto.randomBytes(32).toString('hex'),
  NEXTAUTH_SECRET: crypto.randomBytes(32).toString('base64'),
};

console.log('\n✅ Generated Secrets — paste these into your .env:\n');
for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}="${value}"`);
}