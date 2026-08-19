/* Restauration ciblée du chapitre XII depuis son commit GitHub original.
   Ne remplace aucun autre texte : fusion uniquement par slug. */
window.PITOU_XII_READY=(async()=>{
  const url='https://raw.githubusercontent.com/Carnet-de-Pitou/carnets-de-pitou/2d7e6c3911f909ecac14dea25d66408a35b48f57/library.js';
  try{
    const r=await fetch(url,{cache:'no-store'});
    if(!r.ok)throw new Error('Commit XII inaccessible');
    const source=await r.text();
    const marker='window.PITOU_PUBLIC_LIBRARY = ';
    const i=source.indexOf(marker);
    if(i<0)throw new Error('Bibliothèque historique illisible');
    let raw=source.slice(i+marker.length).trim();
    if(raw.endsWith(';'))raw=raw.slice(0,-1);
    const historic=JSON.parse(raw);
    const xii=historic.find(t=>t&&/chapitre\s+xii\b/i.test(t.title||''));
    if(!xii)throw new Error('Chapitre XII absent du commit historique');
    const base=Array.isArray(window.PITOU_PUBLIC_LIBRARY)?window.PITOU_PUBLIC_LIBRARY:[];
    const map=new Map(base.filter(Boolean).map(t=>[t.slug,t]));
    map.set(xii.slug,{...(map.get(xii.slug)||{}),...xii,local:false});
    window.PITOU_PUBLIC_LIBRARY=[...map.values()];
    console.info('Chapitre XII restauré :',xii.title);
  }catch(e){console.error('Restauration chapitre XII :',e);}
})();