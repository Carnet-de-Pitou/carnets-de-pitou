/* Ordre narratif du Journal de la Reconquête.
   Le condensé historique reste stocké dans texts/journal-de-la-reconquete.js,
   mais n'est plus exposé dans la bibliothèque publique. */
(()=>{
  const LEGACY_SLUG='journal-de-la-reconquete';
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const isJournal=s=>norm(s).includes('journal de la reconquete');

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
  function rankFromText(raw){
    const s=String(raw||'').replace(/\u00a0/g,' ').trim();
    if(!s)return 10000;
    /* Le préambule est toujours le chapitre zéro, quel que soit son libellé exact. */
    if(/\bpr[eé]ambule\b/i.test(s)||/\bprologue\b/i.test(s))return 0;
    const m=s.match(/chap[iî]tre\s*(?:n[°ºo]\s*)?(0|\d+|[ivxlcdm]+)\b/i);
    if(!m)return 10000;
    if(/^\d+$/.test(m[1]))return Number(m[1]);
    const n=romanToInt(m[1]);
    return n===null?10000:n;
  }
  function itemFor(node){
    const slug=node?.dataset?.slug;
    return (window.TEXTS||[]).find(t=>t?.slug===slug)||null;
  }
  function cardRank(node){
    const t=itemFor(node);
    /* On lit d'abord les métadonnées réelles du texte, puis la carte affichée.
       Ainsi le tri fonctionne même si "Chapitre II" n'est pas dans le H3. */
    const source=t?`${t.title||''} ${t.subtitle||''} ${t.series||''} ${t.excerpt||''} ${t.slug||''}`:'';
    const rank=rankFromText(source);
    return rank!==10000?rank:rankFromText(node?.textContent||'');
  }
  function journalIsOpen(){
    if(isJournal(count.textContent))return true;
    return [...cards.querySelectorAll('.card[data-slug]')].some(n=>{
      const t=itemFor(n);
      return t&&isJournal(t.category);
    });
  }
  function reorder(){
    if(!journalIsOpen())return;
    cards.querySelectorAll(`.card[data-slug="${LEGACY_SLUG}"]`).forEach(n=>n.remove());
    const sortable=[...cards.querySelectorAll('.card[data-slug]')].filter(n=>{
      const t=itemFor(n);
      return !t||isJournal(t.category);
    });
    const indexed=sortable.map((node,index)=>({node,index,rank:cardRank(node)}));
    indexed.sort((a,b)=>a.rank-b.rank||a.index-b.index);
    indexed.forEach(x=>cards.appendChild(x.node));
    const visible=cards.querySelectorAll('.card[data-slug]').length;
    const category=(indexed.map(x=>itemFor(x.node)?.category).find(Boolean))||'Journal de la Reconquête';
    count.textContent=`${visible} texte${visible>1?'s':''} · ${category}`;
  }
  let scheduled=false;
  const observer=new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;reorder()});
  });
  observer.observe(cards,{childList:true,subtree:false});
  reorder();
})();
