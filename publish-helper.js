(()=>{
const OWNER='Carnet-de-Pitou',REPO='carnets-de-pitou',PATH='library.js',BRANCH='main';
const btn=document.getElementById('publishBtn');if(!btn)return;
const actions=btn.parentElement,status=document.getElementById('editorStatus');
function say(s){if(status)status.textContent=s}
function esc(s){return(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function slugify(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texte'}
function plain(html){const d=document.createElement('div');d.innerHTML=html;return(d.textContent||'').replace(/\s+/g,' ').trim()}
function currentItem(){const title=(document.getElementById('edTitle')?.value||'').trim(),editor=document.getElementById('richEditor'),raw=editor?.innerHTML||'',text=plain(raw),subtitle=(document.getElementById('edSubtitle')?.value||'').trim(),original=document.getElementById('edOriginalSlug')?.value||'';return{slug:original||slugify(title),title,date:document.getElementById('edDate')?.value||'',category:document.getElementById('edCategory')?.value||'',subtitle,ambience:document.getElementById('edAmbience')?.value||'default',minutes:Math.max(1,Math.ceil(text.split(/\s+/).filter(Boolean).length/220)),excerpt:text.slice(0,220)+(text.length>220?'…':''),html:(subtitle?`<p class="subtitle"><em>${esc(subtitle)}</em></p>`:'')+raw,local:false}}
function validList(list){if(!Array.isArray(list))throw new Error('Bibliothèque GitHub invalide');const slugs=list.filter(Boolean).map(t=>t.slug).filter(Boolean);const dup=slugs.find((s,i)=>slugs.indexOf(s)!==i);if(dup)throw new Error('Sécurité : doublon détecté dans la bibliothèque ('+dup+'). Publication annulée.');return slugs}
function mergeInto(base,extra){const map=new Map();(Array.isArray(base)?base:[]).forEach(t=>t&&t.slug&&map.set(t.slug,{...t,local:false}));if(extra&&extra.slug)map.set(extra.slug,{...extra,local:false});return[...map.values()]}
function content(list){return 'window.PITOU_PUBLIC_LIBRARY = '+JSON.stringify(list)+';\n'}
function b64unicode(str){const bytes=new TextEncoder().encode(str);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin)}
function decodeGithubText(b64){const bin=atob((b64||'').replace(/\s/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
function parseLibrary(source){const marker='window.PITOU_PUBLIC_LIBRARY = ';const i=source.indexOf(marker);if(i<0)throw new Error('Bibliothèque GitHub illisible');let raw=source.slice(i+marker.length).trim();if(raw.endsWith(';'))raw=raw.slice(0,-1);const list=JSON.parse(raw);validList(list);return list}
function token(){return sessionStorage.getItem('pitou-github-token')||''}
function connect(){const t=prompt('Colle ton jeton GitHub dédié aux Carnets. Il restera uniquement dans cet onglet et sera effacé quand tu fermes le navigateur.');if(!t)return false;sessionStorage.setItem('pitou-github-token',t.trim());say('GitHub connecté pour cette session.');return true}
async function api(url,options={}){const t=token();const r=await fetch(url,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(t?{Authorization:'Bearer '+t}:{}),...(options.headers||{})}});if(!r.ok){let msg='Erreur GitHub '+r.status;try{const j=await r.json();if(j.message)msg+=' : '+j.message}catch{}throw new Error(msg)}return r.json()}
async function readRemote(){const current=await api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}&_=${Date.now()}`);return{current,list:parseLibrary(decodeGithubText(current.content))}}
async function publishGitHub(){
 const item=currentItem();if(!item.title){say('Ajoute un titre avant de mettre en ligne.');return}if(!plain(item.html)){say('Le texte est vide.');return}
 btn.click();if(!token()&&!connect())return;
 const direct=document.getElementById('publishDirectBtn');if(direct)direct.disabled=true;say('Publication sécurisée de « '+item.title+' »…');
 try{
  const before=await readRemote(),beforeSlugs=validList(before.list),beforeSet=new Set(beforeSlugs),existed=beforeSet.has(item.slug);
  const finalLibrary=mergeInto(before.list,item),finalSlugs=validList(finalLibrary);
  const expected=before.list.length+(existed?0:1);
  if(finalLibrary.length!==expected)throw new Error('Sécurité : nombre de textes inattendu avant publication. Publication annulée.');
  if([...beforeSet].some(s=>!finalSlugs.includes(s)))throw new Error('Sécurité : un ancien texte disparaîtrait. Publication annulée.');
  const body={message:'Publication depuis l’éditeur des Carnets : '+item.title,content:b64unicode(content(finalLibrary)),sha:before.current.sha,branch:BRANCH};
  await api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const after=await readRemote(),afterSlugs=validList(after.list),afterSet=new Set(afterSlugs),missing=beforeSlugs.filter(s=>!afterSet.has(s)),saved=after.list.find(t=>t&&t.slug===item.slug);
  if(missing.length)throw new Error('ALERTE : '+missing.length+' ancien(s) texte(s) manquent après publication. N’ajoute rien d’autre.');
  if(!saved)throw new Error('ALERTE : le texte publié est absent de GitHub. N’ajoute rien d’autre.');
  if(after.list.length!==expected)throw new Error('ALERTE : le nombre de textes sur GitHub est incohérent après publication. N’ajoute rien d’autre.');
  if((saved.title||'')!==item.title||plain(saved.html||'')!==plain(item.html||''))throw new Error('ALERTE : GitHub ne contient pas exactement le texte envoyé. N’ajoute rien d’autre.');
  window.PITOU_PUBLIC_LIBRARY=after.list;localStorage.setItem('pitou-published','[]');
  say('Publié et vérifié : « '+item.title+' ». '+after.list.length+' texte(s) présents sur GitHub, aucun ancien texte perdu.');setTimeout(()=>location.reload(),3500)
 }catch(e){say(e.message+' — aucune donnée locale n’a été supprimée.');if(e.message.includes('401')||e.message.includes('403'))sessionStorage.removeItem('pitou-github-token')}finally{if(direct)direct.disabled=false}
}
let direct=document.getElementById('publishDirectBtn');if(!direct){direct=document.createElement('button');direct.type='button';direct.id='publishDirectBtn';direct.className='admin-primary';direct.textContent='Mettre en ligne sur le site';actions.insertBefore(direct,btn.nextSibling)}direct.onclick=publishGitHub;
let connectBtn=document.getElementById('githubConnectBtn');if(!connectBtn){connectBtn=document.createElement('button');connectBtn.type='button';connectBtn.id='githubConnectBtn';connectBtn.textContent='Connexion GitHub';actions.appendChild(connectBtn)}connectBtn.onclick=connect;window.publishPitouToGitHub=publishGitHub;
})();