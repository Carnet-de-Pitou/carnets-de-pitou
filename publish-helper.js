(()=>{
const btn=document.getElementById('publishBtn');if(!btn)return;
function localLibrary(){try{return JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{return[]}}
function downloadLibrary(){
 const map=new Map(),base=Array.isArray(window.PITOU_PUBLIC_LIBRARY)?window.PITOU_PUBLIC_LIBRARY:[];
 base.forEach(t=>{if(t&&t.slug)map.set(t.slug,{...t,local:false})});
 localLibrary().forEach(t=>{if(t&&t.slug)map.set(t.slug,{...t,local:false})});
 const content='window.PITOU_PUBLIC_LIBRARY = '+JSON.stringify([...map.values()])+';\n';
 const blob=new Blob([content],{type:'application/javascript;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='library.js';a.style.display='none';document.body.appendChild(a);a.click();
 setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},2000);
 const s=document.getElementById('editorStatus');if(s)s.textContent='Texte enregistré puis library.js préparé. Remplace celui du dépôt GitHub.';
}
// editor.js utilise btn.onclick. Ce wrapper appelle d'abord cette publication synchrone,
// puis exporte seulement si pitou-published a réellement changé.
const original=btn.onclick;
btn.onclick=function(e){
 const before=localStorage.getItem('pitou-published')||'[]';
 if(typeof original==='function')original.call(this,e);
 const after=localStorage.getItem('pitou-published')||'[]';
 if(after!==before)downloadLibrary();
};
window.downloadPitouLibrary=downloadLibrary;
})();