/* Catalogue léger des Carnets — ne modifie aucune source. */
(()=>{
 const meta=t=>({slug:t.slug,title:t.title||'',date:t.date||t.year||'',category:t.category||'',subtitle:t.subtitle||'',ambience:t.ambience||'default',...(t.series?{series:t.series}:{}),minutes:t.minutes||1,excerpt:t.excerpt||''});
 window.PITOU_BUILD_CATALOGUE=(texts=[])=>texts.filter(t=>t&&t.slug).map(meta);
})();
