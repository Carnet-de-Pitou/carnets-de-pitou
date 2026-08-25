/* Ordre narratif du Journal de la Reconquête.
   Le condensé historique reste stocké dans texts/journal-de-la-reconquete.js,
   mais n'est plus exposé dans la bibliothèque publique. */
(()=>{
  const CATEGORY='Journal de la Reconquête';
  const LEGACY_SLUG='journal-de-la-reconquete';

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
    /* Le préambule peut être nommé "Préambule", "Chapitre 0", "Chapitre 0 : Préambule", etc. */
    if(/\bpr[eé]ambule\b/i.test(s))return 0;
    const m=s.match(/chap[iî]tre\s*(?:n[°ºo]\s*)?(0|\d+|[ivxlcdm]+)\b/i);
    if(!m)return 10000;
    if(/^\d+$/.test(m[1]))return Number(m[1]);
    const n=romanToInt(m[1]);
    return n===null?10000:n;
  }
  function cardRank(node){
    /* Ne dépend plus uniquement du H3 : certains chapitres issus de la bibliothèque
       portent l'indication de chapitre dans d'autres champs de la carte. */
    return rankFromText(node?.textContent||'');
  }
  function reorder(){
    if(!count.textContent.includes(CATEGORY))return;
    const nodes=[...cards.querySelectorAll('.card[data-slug]')];
    nodes.filter(n=>n.dataset.slug===LEGACY_SLUG).forEach(n=>n.remove());
    const sortable=[...cards.querySelectorAll('.card[data-slug]')];
    const indexed=sortable.map((node,index)=>({node,index,rank:cardRank(node)}));
    indexed.sort((a,b)=>a.rank-b.rank||a.index-b.index);
    const ordered=indexed.map(x=>x.node);
    const changed=ordered.some((node,i)=>node!==sortable[i]);
    if(changed)ordered.forEach(n=>cards.appendChild(n));
    const visible=cards.querySelectorAll('.card[data-slug]').length;
    const expected=`${visible} texte${visible>1?'s':''} · ${CATEGORY}`;
    if(count.textContent!==expected)count.textContent=expected;
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
