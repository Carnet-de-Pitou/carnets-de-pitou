(() => {
const $=id=>document.getElementById(id);
const editor=$('richEditor'), status=$('editorStatus');
if(!editor)return;

const categories=[...new Set(TEXTS.map(t=>t.category))];
$('edCategory').innerHTML=categories.map(c=>`<option>${c}</option>`).join('');

function focusEditor(){editor.focus()}
document.querySelectorAll('#toolbar [data-cmd]').forEach(b=>b.addEventListener('click',()=>{
 focusEditor(); document.execCommand(b.dataset.cmd,false,null);
}));
document.querySelectorAll('#toolbar [data-block]').forEach(b=>b.addEventListener('click',()=>{
 focusEditor(); document.execCommand('formatBlock',false,b.dataset.block);
}));
$('fontFamily').addEventListener('change',e=>{focusEditor();document.execCommand('fontName',false,e.target.value)});
$('fontSize').addEventListener('change',e=>{focusEditor();document.execCommand('fontSize',false,e.target.value)});
$('addLink').onclick=()=>{const u=prompt('Adresse du lien :','https://');if(u){focusEditor();document.execCommand('createLink',false,u)}};
$('addRule').onclick=()=>{focusEditor();document.execCommand('insertHorizontalRule',false,null)};
$('clearFormat').onclick=()=>{focusEditor();document.execCommand('removeFormat',false,null)};

function getArticle(){
 return {
   id: Date.now().toString(),
   title:$('edTitle').value.trim()||'Sans titre',
   date:$('edDate').value,
   category:$('edCategory').value,
   subtitle:$('edSubtitle').value.trim(),
   html:editor.innerHTML
 };
}
function slugify(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texte'}
function setStatus(s){status.textContent=s;setTimeout(()=>{if(status.textContent===s)status.textContent=''},4000)}

$('previewBtn').onclick=()=>{
 const a=getArticle();
 $('previewTitle').textContent=a.title;
 $('previewSubtitle').textContent=a.subtitle;
 $('previewMeta').textContent=`${a.category}${a.date?' · '+new Date(a.date+'T12:00:00').toLocaleDateString('fr-FR'):''}`;
 $('previewArticle').innerHTML=a.html;
 $('previewModal').style.display='block';
 document.body.style.overflow='hidden';
};
$('previewClose').onclick=()=>{$('previewModal').style.display='none';document.body.style.overflow=''};

function drafts(){try{return JSON.parse(localStorage.getItem('pitou-drafts')||'[]')}catch{return []}}
function writeDrafts(d){localStorage.setItem('pitou-drafts',JSON.stringify(d));renderDrafts()}
$('saveDraftBtn').onclick=()=>{
 const a=getArticle(), d=drafts();
 const existing=d.findIndex(x=>x.title===a.title);
 if(existing>=0)a.id=d[existing].id,d[existing]=a; else d.unshift(a);
 writeDrafts(d.slice(0,50)); setStatus('Brouillon sauvegardé dans ce navigateur.');
};
function renderDrafts(){
 const d=drafts();
 $('draftList').innerHTML=d.length?d.map(x=>`<div class="draft-item"><button data-id="${x.id}">${escapeHTML(x.title)}</button><small>${escapeHTML(x.category)}${x.date?' · '+x.date:''}</small></div>`).join(''):'<small>Aucun brouillon.</small>';
 $('draftList').querySelectorAll('button').forEach(b=>b.onclick=()=>{
   const a=d.find(x=>x.id===b.dataset.id); if(!a)return;
   $('edTitle').value=a.title;$('edDate').value=a.date||'';$('edCategory').value=a.category;
   $('edSubtitle').value=a.subtitle||'';editor.innerHTML=a.html;setStatus('Brouillon chargé.');
 });
}
function escapeHTML(s){return (s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

$('newBtn').onclick=()=>{
 if(confirm('Vider l’éditeur pour commencer un nouveau texte ?')){
   $('edTitle').value='';$('edDate').value='';$('edSubtitle').value='';editor.innerHTML='<p></p>';setStatus('Nouvelle page.');
 }
};

$('exportBtn').onclick=()=>{
 const a=getArticle(), slug=slugify(a.title);
 const file=`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${escapeHTML(a.title)}</title></head>
<body>
<article class="article" data-title="${escapeHTML(a.title)}" data-date="${escapeHTML(a.date)}" data-category="${escapeHTML(a.category)}">
${a.subtitle?`<p class="subtitle"><em>${escapeHTML(a.subtitle)}</em></p>`:''}
${a.html}
</article>
</body></html>`;
 const blob=new Blob([file],{type:'text/html;charset=utf-8'});
 const url=URL.createObjectURL(blob), link=document.createElement('a');
 link.href=url;link.download=slug+'.html';link.click();URL.revokeObjectURL(url);
 setStatus('Article exporté. Il peut être ajouté au dossier texts/ lors de la publication.');
};

editor.addEventListener('paste',e=>{
 // Keep normal rich-text paste from Word/browser. Plain text fallback remains browser-native.
 setTimeout(()=>setStatus('Texte collé. Vérifie l’aperçu : Word peut importer quelques styles inutiles.'),50);
});

function stripText(html){
 const d=document.createElement('div'); d.innerHTML=html;
 return (d.textContent||'').replace(/\s+/g,' ').trim();
}
function estimateMinutes(html){
 const words=stripText(html).split(/\s+/).filter(Boolean).length;
 return Math.max(1,Math.ceil(words/220));
}
function published(){try{return JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{return []}}
function savePublished(d){localStorage.setItem('pitou-published',JSON.stringify(d))}

$('publishBtn').onclick=()=>{
 const a=getArticle();
 if(!$('edTitle').value.trim()){setStatus('Ajoute un titre avant de publier.');return}
 const plain=stripText(a.html);
 if(!plain){setStatus('Le texte est vide.');return}
 const slug=slugify(a.title);
 const item={
   slug,
   title:a.title,
   date:a.date||'',
   category:a.category,
   subtitle:a.subtitle||'',
   minutes:estimateMinutes(a.html),
   excerpt:plain.slice(0,220)+(plain.length>220?'…':''),
   html:(a.subtitle?`<p class="subtitle"><em>${escapeHTML(a.subtitle)}</em></p>`:'')+a.html,
   local:true
 };
 let d=published();
 const i=d.findIndex(x=>x.slug===slug);
 if(i>=0){
   if(!confirm('Un texte portant ce titre est déjà publié localement. Le remplacer ?'))return;
   d[i]=item;
 }else d.unshift(item);
 savePublished(d);
 setStatus('Publié. Rechargement de la bibliothèque…');
 setTimeout(()=>location.reload(),650);
};

$('exportLibraryBtn').onclick=()=>{
 const payload={
   format:'carnets-de-pitou-library-v1',
   exported_at:new Date().toISOString(),
   published:published(),
   drafts:drafts()
 };
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='carnets-de-pitou-sauvegarde.json';a.click();URL.revokeObjectURL(url);
 setStatus('Sauvegarde de la bibliothèque exportée.');
};

$('importLibraryInput').addEventListener('change',async e=>{
 const f=e.target.files[0]; if(!f)return;
 try{
   const payload=JSON.parse(await f.text());
   if(payload.format!=='carnets-de-pitou-library-v1')throw new Error();
   if(!confirm('Restaurer cette sauvegarde ? Les articles locaux et brouillons actuels seront remplacés.'))return;
   savePublished(Array.isArray(payload.published)?payload.published:[]);
   writeDrafts(Array.isArray(payload.drafts)?payload.drafts:[]);
   setStatus('Sauvegarde restaurée. Rechargement…');
   setTimeout(()=>location.reload(),650);
 }catch(err){setStatus('Fichier de sauvegarde invalide.')}
});

renderDrafts();
})();