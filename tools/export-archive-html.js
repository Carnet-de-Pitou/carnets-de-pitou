#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'library-archive.js'),'utf8');
const box={window:{}};vm.createContext(box);vm.runInContext(src,box,{filename:'library-archive.js'});
const items=box.window.PITOU_PUBLIC_LIBRARY||[];
const outDir=path.join(root,'texts');fs.mkdirSync(outDir,{recursive:true});
const sha=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
let created=0,existing=0,conflicts=[];
for(const item of items){
  if(!item||!item.slug||typeof item.html!=='string') throw new Error(`Archive invalide: ${item&&item.slug}`);
  const p=path.join(outDir,`${item.slug}.html`);
  if(fs.existsSync(p)){
    const old=fs.readFileSync(p,'utf8');
    if(old!==item.html) conflicts.push({slug:item.slug,file:sha(old),archive:sha(item.html)});
    else existing++;
  } else { fs.writeFileSync(p,item.html,'utf8'); created++; }
}
if(conflicts.length){
  console.error('CONFLITS: des HTML existants different de l archive; aucun ecrasement effectue.');
  for(const c of conflicts) console.error(`${c.slug} file=${c.file} archive=${c.archive}`);
  process.exit(1);
}
let missing=0,mismatch=0;
for(const item of items){const p=path.join(outDir,`${item.slug}.html`);if(!fs.existsSync(p)){missing++;continue;}if(fs.readFileSync(p,'utf8')!==item.html)mismatch++;}
if(missing||mismatch) throw new Error(`Validation echouee: missing=${missing}, mismatch=${mismatch}`);
console.log(`Archive ${items.length}: deja identiques=${existing}; crees=${created}; couverture=${items.length-missing}/${items.length}; contenu exact=OK.`);
