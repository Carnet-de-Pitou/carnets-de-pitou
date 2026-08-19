/* Restauration de securite des chapitres IV et VII de "Magie, collocation et petites emmerdes".
   Les textes sont relus depuis leurs commits GitHub historiques, puis fusionnes sans supprimer la bibliotheque actuelle. */
window.PITOU_RECOVERY_READY=(async()=>{
  const wanted=[
    {url:'https://raw.githubusercontent.com/Carnet-de-Pitou/carnets-de-pitou/eb18403aabf7f956c0e0d97dc33ce09aa7935d5d/library.js',slug:'chapitre-iv-les-trucculentes-trucculations-d-un-encu-d-un-prince-marchand-autodidacte'},
    {url:'https://raw.githubusercontent.com/Carnet-de-Pitou/carnets-de-pitou/3a577e29e09ff502f396694c260d7dbc0a5a5e5e/library.js',slug:'chapitre-vii-l-heroisme-la-beaute-interieure-bref-tous-ces-trucs-pour-les-moches-ou-suicidaires'}
  ];
  const recovered=[];
  for(const item of wanted){
    try{
      const r=await fetch(item.url,{cache:'no-store'});
      if(!r.ok) continue;
      const source=await r.text();
      const match=source.match(/window\.PITOU_PUBLIC_LIBRARY\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
      if(!match) continue;
      const arr=JSON.parse(match[1]);
      const found=arr.find(t=>t&&t.slug===item.slug);
      if(found) recovered.push({...found,local:false});
    }catch(e){ console.error('Restauration Carnets:',e); }
  }
  if(recovered.length){
    const base=Array.isArray(window.PITOU_PUBLIC_LIBRARY)?window.PITOU_PUBLIC_LIBRARY:[];
    const map=new Map(base.filter(Boolean).map(t=>[t.slug,t]));
    recovered.forEach(t=>map.set(t.slug,{...(map.get(t.slug)||{}),...t,local:false}));
    window.PITOU_PUBLIC_LIBRARY=[...map.values()];
  }
})();
