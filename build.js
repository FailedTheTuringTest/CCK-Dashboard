// build.js
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
if (!apiKey) {
  console.error('API key not found in .env');
  process.exit(1);
}

const scriptJsPath = './script.js';
let scriptJs = fs.readFileSync(scriptJsPath, 'utf8');

// Replace the placeholder with the actual API key
scriptJs = scriptJs.replace(
  /const ALPHA_VANTAGE_API_KEY = 'API_KEY_PLACEHOLDER';/,
  `const ALPHA_VANTAGE_API_KEY = '${apiKey}';`
);

fs.writeFileSync(scriptJsPath, scriptJs);
console.log('API key injected into script.js');
