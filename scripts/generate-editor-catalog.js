const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const textsDir = path.join(root, 'texts');
const entries = [];

for (const file of fs.readdirSync(textsDir).filter(name => name.endsWith('.js')).sort()) {
  const context = { window: {} };
  vm.createContext(context);
  try {
    vm.runInContext(fs.readFileSync(path.join(textsDir, file), 'utf8'), context, { filename: file });
    const item = context.window.PITOU_LIBRARY_ITEM;
    if (!item || !item.slug) continue;
    const { html, local, pendingDeployment, ...metadata } = item;
    entries.push(metadata);
  } catch (error) {
    console.warn(`Catalogue ignoré pour ${file}: ${error.message}`);
  }
}

const output = `window.PITOU_EDITOR_CATALOG = ${JSON.stringify(entries)};\n`;
fs.writeFileSync(path.join(root, 'library-catalog.js'), output);
console.log(`${entries.length} carnets indexés pour l'éditeur.`);
