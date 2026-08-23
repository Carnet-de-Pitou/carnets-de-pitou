#!/usr/bin/env node
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const textsDir=path.join(root,'texts');
const source=fs.readFileSync(path.join(root,'library-archive.js'),'utf8');
const box={window:{}};vm.createContext(box);vm.runInContext(source,box,{filename:'library-archive.js'});
const items=box.window.PITOU_PUBLIC_LIBRARY||[];
if(!Array.isArray(items)||!items.length)throw new Error('Archive absente ou vide');
const seen=new Set();let created=0,existingIdentical=0,existingPreserved=0;
for(const item of items){
  if(!item||typeof item.slug!=='string'||!item.slug.trim())throw new Error('Entree archive sans slug');
  if(seen.has(item.slug))throw new Error(`Slug duplique: ${item.slug}`);seen.add(item.slug);
  if(typeof item.html!=='string')throw new Error(`HTML absent: ${item.slug}`);
  const target=path.join(textsDir,`${item.slug}.html`);
  if(fs.existsSync(target)){
    const current=fs.readFileSync(target,'utf8');
    if(current===item.html) existingIdentical++;
    else { existingPreserved++; console.log(`PRESERVE version individuelle existante: ${item.slug}`); }
    continue;
  }
  fs.writeFileSync(target,item.html,'utf8');created++;
}
let available=0,generatedExact=0;
for(const item of items){
  const target=path.join(textsDir,`${item.slug}.html`);
  if(!fs.existsSync(target))throw new Error(`Migration incomplete: ${item.slug}`);
  available++;
  const current=fs.readFileSync(target,'utf8');
  const a=crypto.createHash('sha256').update(item.html).digest('hex');
  const b=crypto.createHash('sha256').update(current).digest('hex');
  if(a===b) generatedExact++;
}
if(available!==items.length)throw new Error(`Couverture incomplete: ${available}/${items.length}`);
console.log(`Migration sure: archive=${items.length}; crees=${created}; existants identiques=${existingIdentical}; existants preserves=${existingPreserved}; disponibles=${available}/${items.length}; identiques archive=${generatedExact}.`);
