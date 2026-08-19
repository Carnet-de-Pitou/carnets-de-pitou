(()=>{
const OWNER='Carnet-de-Pitou',REPO='carnets-de-pitou',PATH='library.js',BRANCH='main';
const btn=document.getElementById('publishBtn');if(!btn)return;
const actions=btn.parentElement,status=document.getElementById('editorStatus');
function say(s){if(status)status.textContent=s}
function localLibrary(){try{return JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{return[]}}
function esc(s){return(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function slugify(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texte'}
function plain(html){const d=document.createElement('div');d.innerHTML=html;return(d.textContent||'').replace(/\s+/g,' ').trim()}
function currentItem(){
 const title=(document.getElementById('edTitle')?.value||'').trim(),editor=document.getElementById('richEditor');
 const raw=editor?.innerHTML||'',text=plain(raw),subtitle=(document.getElementById('edSubtitle')?.value||'').trim();
 const original=document.getElementById('edOriginalSlug')?.value||'';
 return {slug:original||slugify(title),title,date:document.getElementById('edDate')?.value||'',category:document.getElementById('edCategory')?.value||'',subtitle,ambience:document.getElementById('edAmbience')?.value||'default',minutes:Math.max(1,Math.ceil(text.split(/\s+/).filter(Boolean).length/220)),excerpt:text.slice(0,220)+(text.length>220?'…':''),html:(subtitle?`<p class="subtitle"><em>${esc(subtitle)}</em></p>`:'')+raw,local:false};
}
function merged(extra){const map=new Map(),base=Array.isArray(window.PITOU_PUBLIC_LIBRARY)?window.PITOU_PUBLIC_LIBRARY:[];base.forEach(t=>t&&t.slug&&map.set(t.slug,{...t,local:false}));localLibrary().forEach(t=>t&&t.slug&&map.set(t.slug,{...t,local:false}));if(extra&&extra.slug)map.set(extra.slug,{...extra,local:false});return[...map.values()]}
function content(extra){return 'window.PITOU_PUBLIC_LIBRARY = '+JSON.stringify(merged(extra))+';\n'}
function b64unicode(str){const bytes=new TextEncoder().encode(str);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin)}
function token(){return sessionStorage.getItem('pitou-github-token')||''}
function connect(){const t=prompt('Colle ton jeton GitHub dédié aux Carnets. Il restera uniquement dans cet onglet et sera effacé quand tu fermes le navigateur.');if(!t)return false;sessionStorage.setItem('pitou-github-token',t.trim());say('GitHub connecté pour cette session.');return true}
async function api(url,options={}){const t=token();const r=await fetch(url,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(t?{Authorization:'Bearer '+t}:{}),...(options.headers||{})}});if(!r.ok){let msg='Erreur GitHub '+r.status;try{const j=await r.json();if(j.message)msg+=' : '+j.message}catch{}throw new Error(msg)}return r.json()}
async function publishGitHub(){
 const item=currentItem();if(!item.title){say('Ajoute un titre avant de mettre en ligne.');return}if(!plain(item.html)){say('Le texte est vide.');return}
 // Enregistre aussi la copie locale, mais l’envoi GitHub prend explicitement le texte ouvert dans l’éditeur.
 // Ainsi la mise en ligne ne dépend plus d’un état localStorage ancien ou incohérent.
 btn.click();
 if(!token()&&!connect())return;
 const direct=document.getElementById('publishDirectBtn');if(direct)direct.disabled=true;say('Publication de « '+item.title+' » sur GitHub…');
 try{const current=await api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`);const finalContent=content(item);const body={message:'Publication depuis l’éditeur des Carnets : '+item.title,content:b64unicode(finalContent),sha:current.sha,branch:BRANCH};await api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});window.PITOU_PUBLIC_LIBRARY=merged(item);localStorage.setItem('pitou-published','[]');say('Publié : « '+item.title+' » est envoyé sur GitHub. GitHub Pages va actualiser le site.');setTimeout(()=>location.reload(),3500)}catch(e){say(e.message+' — aucune donnée locale n’a été supprimée.');if(e.message.includes('401')||e.message.includes('403'))sessionStorage.removeItem('pitou-github-token')}finally{if(direct)direct.disabled=false}
}
let direct=document.getElementById('publishDirectBtn');if(!direct){direct=document.createElement('button');direct.type='button';direct.id='publishDirectBtn';direct.className='admin-primary';direct.textContent='Mettre en ligne sur le site';actions.insertBefore(direct,btn.nextSibling)}direct.onclick=publishGitHub;
let connectBtn=document.getElementById('githubConnectBtn');if(!connectBtn){connectBtn=document.createElement('button');connectBtn.type='button';connectBtn.id='githubConnectBtn';connectBtn.textContent='Connexion GitHub';actions.appendChild(connectBtn)}connectBtn.onclick=connect;
window.publishPitouToGitHub=publishGitHub;
})();