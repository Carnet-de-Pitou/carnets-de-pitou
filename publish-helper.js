(()=>{
const btn=document.getElementById('publishBtn');if(!btn)return;
function localLibrary(){try{return JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{return[]}}
function downloadLibrary(){
 const map=new Map(),base=Array.isArray(window.PITOU_PUBLIC_LIBRARY)?window.PITOU_PUBLIC_LIBRARY:[];
 base.forEach(t=>{if(t&&t.slug)map.set(t.slug,{...t,local:false})});
 localLibrary().forEach(t=>{if(t&&t.slug)map.set(t.slug,{...t,local:false})});
 const content='window.PITOU_PUBLIC_LIBRARY = '+JSON.stringify([...map.values()])+';\n';
 const blob=new Blob([content],{type:'application/javascript;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='library.js';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 const s=document.getElementById('editorStatus');if(s)s.textContent='library.js préparé avec la bibliothèque publique et tes publications locales.';
}
// Bouton séparé et explicite : aucun conflit avec le gestionnaire Publier de editor.js.
const actions=btn.parentElement;
let exportBtn=document.getElementById('downloadLibraryJsBtn');
if(!exportBtn){exportBtn=document.createElement('button');exportBtn.type='button';exportBtn.id='downloadLibraryJsBtn';exportBtn.textContent='Télécharger library.js';actions.insertBefore(exportBtn,btn.nextSibling)}
exportBtn.onclick=downloadLibrary;
window.downloadPitouLibrary=downloadLibrary;
})();