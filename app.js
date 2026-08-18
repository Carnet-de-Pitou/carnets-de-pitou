// V5: articles publiés localement depuis l'éditeur
try {
  const localPublished = JSON.parse(localStorage.getItem('pitou-published') || '[]');
  localPublished.forEach(a => {
    if (!TEXTS.some(t => t.slug === a.slug)) TEXTS.unshift(a);
  });
} catch(e) {}
const shelves=document.getElementById('shelves');
const cards=document.getElementById('cards');
const search=document.getElementById('search');
const resultCount=document.getElementById('resultCount');
const reader=document.getElementById('reader');
const article=document.getElementById('article');
const readerTitle=document.getElementById('readerTitle');
const readerMeta=document.getElementById('readerMeta');
const archiveBox=document.getElementById('archiveBox');
const archiveIndex=document.getElementById('archiveIndex');
let activeCategory=null;
let currentIndex=-1;

const categories=[...new Set(TEXTS.map(t=>t.category))];
const escapeHtml=s=>(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function renderShelves(){
 shelves.innerHTML=categories.map(c=>{
   const n=TEXTS.filter(t=>t.category===c).length;
   return `<button class="shelf" data-cat="${escapeHtml(c)}"><span class="spine"></span><div class="eyebrow">Rubrique</div><h3>${escapeHtml(c)}</h3><div class="shelf-count">${n} texte${n>1?'s':''}</div></button>`;
 }).join('');
 shelves.querySelectorAll('.shelf').forEach(b=>b.onclick=()=>{
   activeCategory=b.dataset.cat; search.value=''; renderCards();
   document.getElementById('derniers').scrollIntoView({behavior:'smooth'});
 });
}

function renderCards(){
 const q=search.value.trim().toLowerCase();
 let list=TEXTS.filter(t=>(!activeCategory||t.category===activeCategory) &&
   (!q || `${t.title} ${t.category} ${t.excerpt}`.toLowerCase().includes(q)));
 resultCount.textContent=`${list.length} texte${list.length>1?'s':''}${activeCategory?' · '+activeCategory:''}`;
 cards.innerHTML=list.length?list.map(t=>`
   <article class="card" data-slug="${t.slug}">
    <div class="meta">${escapeHtml(t.category)} · ${t.minutes} min</div>
    <h3>${escapeHtml(t.title)}</h3>
    <div class="excerpt">${escapeHtml(t.excerpt)}</div>
    <div class="readmore">Ouvrir le texte →</div>
   </article>`).join(''):`<div class="empty">Aucun texte trouvé.</div>`;
 cards.querySelectorAll('.card').forEach(c=>c.onclick=()=>openText(c.dataset.slug));
}

async function openText(slug){
 const t=TEXTS.find(x=>x.slug===slug); if(!t)return;
 currentIndex=TEXTS.findIndex(x=>x.slug===slug);
 readerTitle.textContent=t.title;
 readerMeta.textContent=`${t.category} · environ ${t.minutes} min de lecture`;
 article.innerHTML='<p>Ouverture du manuscrit…</p>';
 reader.style.display='block'; document.body.style.overflow='hidden'; reader.scrollTop=0;
 try{
   if(t.html){
     article.innerHTML=t.html;
   } else {
     const html=await fetch(`texts/${slug}.html`).then(r=>{if(!r.ok)throw new Error();return r.text()});
     const doc=new DOMParser().parseFromString(html,'text/html');
     const content=doc.querySelector('.article')||doc.querySelector('article')||doc.body;
     article.innerHTML=content.innerHTML;
   }
 }catch(e){
   article.innerHTML='<p>Le navigateur bloque la lecture automatique de ce fichier local. Ouvre le texte depuis son fichier HTML dans le dossier <em>texts</em>, ou utilise Firefox/Chrome avec les fichiers locaux autorisés.</p>';
 }
 updateReaderNav();
}
function updateReaderNav(){
 document.getElementById('prevText').disabled=currentIndex<=0;
 document.getElementById('nextText').disabled=currentIndex>=TEXTS.length-1;
}
function closeReader(){reader.style.display='none';document.body.style.overflow=''}
document.getElementById('close').onclick=closeReader;
document.getElementById('backShelf').onclick=closeReader;
document.getElementById('prevText').onclick=()=>currentIndex>0&&openText(TEXTS[currentIndex-1].slug);
document.getElementById('nextText').onclick=()=>currentIndex<TEXTS.length-1&&openText(TEXTS[currentIndex+1].slug);
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeReader()});
search.addEventListener('input',()=>{activeCategory=null;renderCards()});

function renderArchives(){
 const dated=TEXTS.filter(t=>t.date).sort((a,b)=>b.date.localeCompare(a.date));
 const undated=TEXTS.filter(t=>!t.date);
 const years=[...new Set(dated.map(t=>t.date.slice(0,4)))];
 archiveIndex.innerHTML=years.map(y=>`<button data-year="${y}">${y}</button>`).join('')+
   `<button data-year="undated">Sans date</button>`;
 archiveIndex.querySelectorAll('button').forEach(b=>b.onclick=()=>showArchive(b.dataset.year));
 showArchive(years[0]||'undated');

 function showArchive(year){
   if(year==='undated'){
     archiveBox.innerHTML=`<div class="archive-year">Dates à compléter</div><p class="archive-undated">Ces textes sont bien dans la bibliothèque, mais leur date originale n'est pas encore renseignée.</p>`+
       undated.map(t=>`<button class="archive-item" data-slug="${t.slug}">${escapeHtml(t.title)} <small>— ${escapeHtml(t.category)}</small></button>`).join('');
   }else{
     const list=dated.filter(t=>t.date.startsWith(year));
     const months=[...new Set(list.map(t=>t.date.slice(5,7)))];
     const monthNames=['','Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
     archiveBox.innerHTML=`<div class="archive-year">${year}</div>`+months.map(m=>
       `<div class="archive-month">${monthNames[Number(m)]}</div>`+
       list.filter(t=>t.date.slice(5,7)===m).map(t=>`<button class="archive-item" data-slug="${t.slug}">${escapeHtml(t.title)} <small>— ${escapeHtml(t.category)}</small></button>`).join('')
     ).join('');
   }
   archiveBox.querySelectorAll('.archive-item').forEach(b=>b.onclick=()=>openText(b.dataset.slug));
 }
}

renderShelves();renderCards();renderArchives();
