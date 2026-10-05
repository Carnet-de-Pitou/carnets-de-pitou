const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
function read(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
read('data.js');
const merged = new Map();
for (const file of ['library-archive.js', 'library-baseline-20260822.js', 'library.js']) {
  read(file);
  for (const item of context.window.PITOU_PUBLIC_LIBRARY) merged.set(item.slug, item);
}
read('library-items.js');
const individual = new Set(context.window.PITOU_LIBRARY_ITEM_SLUGS);
for (const slug of individual) {
  read(`texts/${slug}.js`);
  const item = context.window.PITOU_LIBRARY_ITEM;
  if (!item || item.slug !== slug) throw new Error(`Texte invalide: ${slug}`);
  merged.set(slug, item);
}
const hidden = new Set(['chronique-des-amants-maudits-romance', 'quand-la-nuit-j-ai-peur', 'impuissance-eloge-de-la-mediocrite', 'espoir', 'journal-de-la-reconquete']);
const texts = new Map(context.window.TEXTS.map(item => [item.slug, item]));
for (const [slug, item] of merged) {
  if (!hidden.has(slug) || individual.has(slug)) texts.set(slug, { ...texts.get(slug), ...item, local: false });
}
for (const slug of hidden) if (!individual.has(slug)) texts.delete(slug);
// Le condensé historique est déjà retiré par journal-reconquete-order.js.
texts.delete('journal-de-la-reconquete');
const catalog = [];
for (const item of texts.values()) {
  const { html, local, pendingDeployment, ...metadata } = item;
  metadata.contentBytes = Buffer.byteLength(html || '');
  if (html) {
    const source = `texts/${item.slug}.js`;
    context.window.PITOU_LIBRARY_ITEM = null;
    if (fs.existsSync(path.join(root, source))) read(source);
    if (context.window.PITOU_LIBRARY_ITEM?.html === html) {
      metadata.contentPath = source;
      metadata.contentFormat = 'script';
    } else {
      fs.mkdirSync(path.join(root, 'public-content'), { recursive: true });
      metadata.contentPath = `public-content/${item.slug}.json`;
      metadata.contentFormat = 'json';
      fs.writeFileSync(path.join(root, metadata.contentPath), JSON.stringify({ html }));
    }
  }
  catalog.push(metadata);
}
fs.writeFileSync(path.join(root, 'public-catalog.js'), `window.PITOU_PUBLIC_CATALOG = ${JSON.stringify(catalog)};\n`);
console.log(`Catalogue public: ${catalog.length} textes, ${fs.statSync(path.join(root, 'public-catalog.js')).size} octets`);
