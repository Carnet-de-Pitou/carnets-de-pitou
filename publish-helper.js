(()=>{
const OWNER='Carnet-de-Pitou',REPO='carnets-de-pitou',BRANCH='main',MANIFEST='library-items.js';
const btn=document.getElementById('publishBtn');if(!btn)return;const actions=btn.parentElement,status=document.getElementById('editorStatus');
function say(s){if(status)status.textContent=s}function esc(s){return(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}function slugify(s){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texte'}function plain(h){const d=document.createElement('div');d.innerHTML=h;return(d.textContent||'').replace(/\s+/g,' ').trim()}
function currentItem(){const title=(document.getElementById('edTitle')?.value||'').trim(),raw=document.getElementById('richEditor')?.innerHTML||'',text=plain(raw),subtitle=(document.getElementById('edSubtitle')?.value||'').trim(),original=document.getElementById('edOriginalSlug')?.value||'',series=document.getElementById('edSeries')?.value||'';return{slug:original||slugify(title),title,date:document.getElementById('edDate')?.value||'',category:document.getElementById('edCategory')?.value||'',subtitle,ambience:document.getElementById('edAmbience')?.value||'default',...(series?{series}:{}),minutes:Math.max(1,Math.ceil(text.split(/\s+/).filter(Boolean).length/220)),excerpt:text.slice(0,220)+(text.length>220?'…':''),html:(subtitle?`<p class="subtitle"><em>${esc(subtitle)}</em></p>`:'')+raw,local:false}}
function token(){return sessionStorage.getItem('pitou-github-token')||''}function connect(){const t=prompt('Colle ton jeton GitHub dédié aux Carnets. Il restera uniquement dans cet onglet.');if(!t)return false;sessionStorage.setItem('pitou-github-token',t.trim());say('GitHub connecté.');return true}async function api(url,o={}){const r=await fetch(url,{...o,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token()?{Authorization:'Bearer '+token()}:{}),...(o.headers||{})}});if(!r.ok){let m='Erreur GitHub '+r.status;try{const j=await r.json();if(j.message)m+=' : '+j.message}catch{}throw new Error(m)}return r.json()}
function b64(s){const bytes=new TextEncoder().encode(s);let x='';for(const b of bytes)x+=String.fromCharCode(b);return btoa(x)}function unb64(s){const x=atob((s||'').replace(/\s/g,''));return new TextDecoder().decode(Uint8Array.from(x,c=>c.charCodeAt(0)))}
async function getFile(path){const r=await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}&_=${Date.now()}`,{headers:{Accept:'application/vnd.github+json',...(token()?{Authorization:'Bearer '+token()}:{})}});if(r.status===404)return null;if(!r.ok)throw new Error('Erreur GitHub '+r.status);const j=await r.json();return{sha:j.sha,text:unb64(j.content||'')}}
async function put(path,text,message,sha){const body={message,content:b64(text),branch:BRANCH,...(sha?{sha}:{})};return api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
async function putBase64(path,data,message,sha){const body={message,content:data,branch:BRANCH,...(sha?{sha}:{})};return api(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
function itemScript(item){return 'window.PITOU_LIBRARY_ITEM = '+JSON.stringify(item)+';\n'}function manifestScript(slugs){return 'window.PITOU_LIBRARY_ITEM_SLUGS = '+JSON.stringify(slugs)+';\n'}
async function readManifest(){const f=await getFile(MANIFEST);if(!f)return{sha:null,slugs:[]};const m=f.text.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);if(!m)throw new Error('Index des nouveaux textes illisible');return{sha:f.sha,slugs:JSON.parse(m[1])}}
async function createGitBlob(content,encoding='utf-8'){
  return api(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs`,{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content,encoding})
  })
}
async function branchState(){
  const ref=await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`),
        commit=await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits/${ref.object.sha}`);
  return{commitSha:ref.object.sha,treeSha:commit.tree.sha}
}
async function publishTree(parent,baseTree,entries,message){
  const tree=await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/trees`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({base_tree:baseTree,tree:entries})
  }),commit=await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/commits`,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message,tree:tree.sha,parents:[parent]})
  });
  await api(`https://api.github.com/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`,{
    method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({sha:commit.sha,force:false})
  });
  return commit.sha
}
async function externalizeImages(item){
  const box=document.createElement('div');box.innerHTML=item.html;
  const imgs=[...box.querySelectorAll('img[src^="data:image/"]')],seen=new Map(),entries=[];
  let n=0;
  for(const img of imgs){
    const src=img.getAttribute('src');
    if(seen.has(src)){img.setAttribute('src',seen.get(src));continue}
    const m=src.match(/^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/i);if(!m)continue;
    n++;
    const ext=m[1].toLowerCase().replace('jpeg','jpg'),data=m[2].replace(/\s/g,''),
          path=`assets/text-images/${item.slug}-${n}.${ext}`;
    say(`Image ${n}/${imgs.length} : préparation…`);
    const blob=await createGitBlob(data,'base64'),url='/carnets-de-pitou/'+path;
    entries.push({path,mode:'100644',type:'blob',sha:blob.sha});
    seen.set(src,url);img.setAttribute('src',url)
  }
  item.html=box.innerHTML;
  return{item,count:n,entries}
}
async function publish(){
  const item=currentItem();
  if(!item.title){say('Ajoute un titre avant de mettre en ligne.');return}
  if(!plain(item.html)){say('Le texte est vide.');return}
  btn.click();
  if(!token()&&!connect())return;
  const direct=document.getElementById('publishDirectBtn');if(direct)direct.disabled=true;
  try{
    say('Préparation de « '+item.title+' »…');
    const prepared=await externalizeImages(item),mf=await readManifest(),
          slugs=[...new Set([...mf.slugs,item.slug])],state=await branchState();
    say('Publication atomique du texte, des images et de l’index…');
    const [textBlob,manifestBlob]=await Promise.all([
      createGitBlob(itemScript(prepared.item)),createGitBlob(manifestScript(slugs))
    ]),entries=[...prepared.entries,
      {path:'texts/'+item.slug+'.js',mode:'100644',type:'blob',sha:textBlob.sha},
      {path:MANIFEST,mode:'100644',type:'blob',sha:manifestBlob.sha}
    ];
    await publishTree(state.commitSha,state.treeSha,entries,'Publie en une opération : '+item.title);
    localStorage.setItem('pitou-published','[]');
    say('Publié en une seule opération : « '+item.title+' »'+(prepared.count?` — ${prepared.count} image(s).`:' — sans nouvelle image.'));
    setTimeout(()=>location.reload(),3500)
  }catch(e){
    const conflict=/422|fast forward|reference update/i.test(e.message||'');
    say((conflict?'Le site a changé pendant la publication. Réessaie une fois.':e.message)+' — aucune donnée locale n’a été supprimée.')
  }finally{if(direct)direct.disabled=false}
}
let direct=document.getElementById('publishDirectBtn');if(!direct){direct=document.createElement('button');direct.type='button';direct.id='publishDirectBtn';direct.className='admin-primary';direct.textContent='Mettre en ligne sur le site';actions.insertBefore(direct,btn.nextSibling)}direct.onclick=publish;let c=document.getElementById('githubConnectBtn');if(!c){c=document.createElement('button');c.type='button';c.id='githubConnectBtn';c.textContent='Connexion GitHub';actions.appendChild(c)}c.onclick=connect;window.publishPitouToGitHub=publish;
})();
