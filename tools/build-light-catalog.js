#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'library-archive.js');
const outputPath = path.join(root, 'library-index.js');

function readArchive() {
  const source = fs.readFileSync(sourcePath, 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'library-archive.js' });
  const items = sandbox.window.PITOU_PUBLIC_LIBRARY;
  if (!Array.isArray(items)) throw new Error('PITOU_PUBLIC_LIBRARY absent ou invalide');
  return items;
}

function assertUniqueSlugs(items, label) {
  const seen = new Set();
  const duplicates = [];
  for (const item of items) {
    if (!item || typeof item.slug !== 'string' || !item.slug.trim()) {
      throw new Error(`${label}: entree sans slug valide`);
    }
    if (seen.has(item.slug)) duplicates.push(item.slug);
    seen.add(item.slug);
  }
  if (duplicates.length) throw new Error(`${label}: slugs dupliques: ${[...new Set(duplicates)].join(', ')}`);
  return [...seen].sort();
}

const archive = readArchive();
const light = archive.map(({ html, ...meta }) => ({ ...meta, lazyArchive: true }));

const sourceSlugs = assertUniqueSlugs(archive, 'archive');
const lightSlugs = assertUniqueSlugs(light, 'index');

if (sourceSlugs.length !== lightSlugs.length || sourceSlugs.some((slug, i) => slug !== lightSlugs[i])) {
  throw new Error('ECHEC SECURITE: la liste des slugs du catalogue leger differe de l archive');
}
if (light.some(item => Object.prototype.hasOwnProperty.call(item, 'html'))) {
  throw new Error('ECHEC SECURITE: du HTML integral subsiste dans le catalogue leger');
}

const output = `window.PITOU_ARCHIVE_INDEX = ${JSON.stringify(light)};\n`;
fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Catalogue leger valide: ${light.length} textes, ${Buffer.byteLength(output)} octets.`);
