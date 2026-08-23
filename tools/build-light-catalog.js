#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
function run(file,sandbox){vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox,{filename:file});}
function unique(items,label){const m=new Map();for(const x of items||[]){if(!x||!x.slug)throw new Error(`${label}: entree sans slug`);m.set(x.slug,x)}return m;}
const archiveBox={window:{}};vm.createContext(archiveBox);run('library-archive.js',archiveBox);const archive=archiveBox.window.PITOU_PUBLIC_LIBRARY||[];
const light=archive.map(({html,...meta})=>({...meta,lazyArchive:true}));
if(light.some(x=>Object.prototype.hasOwnProperty.call(x,'html')))throw new Error('HTML present dans index leger');
const a=[...unique(archive,'archive').keys()].sort(),b=[...unique(light,'index').keys()].sort();
if(JSON.stringify(a)!==JSON.stringify(b))throw new Error('Slugs archive/index differents');
fs.writeFileSync(path.join(root,'library-index.js'),`window.PITOU_ARCHIVE_INDEX = ${JSON.stringify(light)};\n`);
// Reproduit le catalogue visible actuel: data.js + archive + bibliotheques + publications individuelles.
const box={window:{}};box.window.window=box.window;vm.createContext(box);run('data.js',box);let merged=[];
for(const file of ['library-archive.js','library-baseline-20260822.js','library.js']){run(file,box);for(const t of box.window.PITOU_PUBLIC_LIBRARY||[])if(t&&t.slug)unique(merged,'merged').set(t.slug,t);const mm=unique(merged,'merged');for(const t of box.window.PITOU_PUBLIC_LIBRARY||[])if(t&&t.slug)mm.set(t.slug,t);merged=[...mm.values()];}
run('library-items.js',box);const individual=box.window.PITOU_LIBRARY_ITEM_SLUGS||[];
for(const slug of individual){const p=path.join(root,'texts',`${slug}.js`);if(!fs.existsSync(p))throw new Error(`Publication individuelle absente: ${slug}`);box.window.PITOU_LIBRARY_ITEM=null;run(path.relative(root,p),box);const t=box.window.PITOU_LIBRARY_ITEM;if(!t||t.slug!==slug)throw new Error(`Publication individuelle invalide: ${slug}`);const mm=unique(merged,'merged');mm.set(slug,t);merged=[...mm.values()];}
const hidden=new Set(['chronique-des-amants-maudits-romance']);merged=merged.filter(t=>!hidden.has(t.slug)||individual.includes(t.slug));
const finalMap=unique(box.window.TEXTS||[],'data');for(const t of merged)finalMap.set(t.slug,{...(finalMap.get(t.slug)||{}),...t,local:false});for(const slug of hidden)if(!individual.includes(slug))finalMap.delete(slug);
const final=[...finalMap.values()];const slugs=[...finalMap.keys()].sort();
fs.writeFileSync(path.join(root,'catalog-reference.json'),JSON.stringify({count:final.length,slugs},null,2)+'\n');
console.log(`Archive: ${archive.length}; index leger: ${Buffer.byteLength(`window.PITOU_ARCHIVE_INDEX = ${JSON.stringify(light)};\n`)} octets; catalogue final actuel: ${final.length} textes.`);
