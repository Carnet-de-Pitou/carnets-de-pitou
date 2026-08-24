/* Ordre narratif du Journal de la Reconquête.
   Le condensé historique reste stocké dans texts/journal-de-la-reconquete.js,
   mais n'est plus exposé dans la bibliothèque publique. */
(()=>{
  const CATEGORY='Journal de la Reconquête';
  const LEGACY_SLUG='journal-de-la-reconquete';

  // Masque uniquement le condensé public, sans supprimer son fichier source.
  if(Array.isArray(window.TEXTS)){
    for(let i=window.TEXTS.length-1;i>=0;i--){
      if(window.TEXTS[i]?.slug===LEGACY_SLUG) window.TEXTS.splice(i,1);
    }
  }

  const cards=document.getElementById('cards');
  const count=document.getElementById('resultCount');
  if(!cards||!count)return;

  function romanToInt(raw){
    const s=String(raw||'').toUpperCase();
    const vals={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
    if(!s||!/^[IVXLCDM]+$/.test(s))return null;
    let n=0,prev=0;
    for(let i=s.length-1;i>=0;i--){const v=vals[s[i]];n+=v<prev?-v:v;prev=Math.max(prev,v)}
    return n||null;
  }
  function rank(title){
    const s=String(title||'').trim();
    if(/^pr[eé]ambule\b/i.test(s))return 0;
    const m=s.match(/chap[iî]tre\s+(\d+|[ivxlcdm]+)/i);
    if(!m)return 10000;
    return /^\d+$/.test(m[1])?Number(m[1]):romanToInt(m[1])??10000;
  }
  function reorder(){
    if(!count.textContent.includes(CATEGORY))return;
    const nodes=[...cards.querySelectorAll('.card[data-slug]')];
    nodes.filter(n=>n.dataset.slug===LEGACY_SLUG).forEach(n=>n.remove());
    const sortable=nodes.filter(n=>n.dataset.slug!==LEGACY_SLUG);
    sortable.sort((a,b)=>rank(a.querySelector('h3')?.textContent)-rank(b.querySelector('h3')?.textContent));
    sortable.forEach(n=>cards.appendChild(n));
    const visible=cards.querySelectorAll('.card[data-slug]').length;
    count.textContent=`${visible} texte${visible>1?'s':''} · ${CATEGORY}`;
  }
  new MutationObserver(()=>queueMicrotask(reorder)).observe(cards,{childList:true,subtree:false});
  reorder();
})();
