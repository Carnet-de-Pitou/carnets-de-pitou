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
function rememberPending(item){
  let items=[];try{items=JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{}
  const pending={...item,local:true,pendingDeployment:true},i=items.findIndex(x=>x&&x.slug===item.slug);
  if(i>=0)items[i]=pending;else items.unshift(pending);
  localStorage.setItem('pitou-published',JSON.stringify(items));
}
function forgetPending(slug){
  let items=[];try{items=JSON.parse(localStorage.getItem('pitou-published')||'[]')}catch{}
  localStorage.setItem('pitou-published',JSON.stringify(items.filter(x=>!x||x.slug!==slug)));
}
function samePublishedItem(a,b){
  return !!a&&!!b&&['slug','title','date','category','subtitle','ambience','html'].every(k=>(a[k]||'')===(b[k]||''));
}
async function waitForDeployment(item){
  for(let attempt=0;attempt<36;attempt++){
    if(attempt)await new Promise(resolve=>setTimeout(resolve,5000));
    try{
      const source=await fetch(`texts/${encodeURIComponent(item.slug)}.js?deployment=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.text()}),
            match=source.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/),online=match?JSON.parse(match[1]):null;
      if(samePublishedItem(item,online)){
        forgetPending(item.slug);
        say('Déploiement terminé : « '+item.title+' » est à jour sur le site.');
        return true
      }
    }catch{}
  }
  say('Publication envoyée. La version corrigée reste protégée dans cet éditeur en attendant la fin du déploiement.');
  return false
}
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
function installProofreader(){
  const editor=document.getElementById('richEditor'),title=document.getElementById('edTitle'),subtitle=document.getElementById('edSubtitle');
  if(!editor)return null;
  [editor,title,subtitle].filter(Boolean).forEach(el=>{el.setAttribute('lang','fr');el.setAttribute('spellcheck','true')});

  const ignored=new Set(),proofStyle=document.createElement('style');
  proofStyle.textContent=`
    .proofreader-panel{display:none;margin-top:14px;border:1px solid #745637;background:#120c08;padding:15px;color:#d7c5a7}
    .proofreader-panel.open{display:block}.proofreader-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}
    .proofreader-head strong{color:#ead8b5}.proofreader-list{display:grid;gap:8px;max-height:360px;overflow:auto}
    .proofreader-issue{border-left:3px solid #a97843;background:#1b120c;padding:10px 12px}
    .proofreader-issue code{display:block;white-space:pre-wrap;color:#f0d6ad;background:#0d0906;padding:6px 8px;margin:6px 0;font-family:Georgia,serif}
    .proofreader-actions{display:flex;flex-wrap:wrap;gap:6px}.proofreader-actions button,.proofreader-head button{background:#2a1c12;border:1px solid #745637;color:#e6d5b7;padding:6px 8px;cursor:pointer}
    .proofreader-ok{color:#b9d0a4}.proofreader-note{color:#9f8b6d;font-size:.82rem;margin:8px 0 0}
  `;
  document.head.appendChild(proofStyle);

  const panel=document.createElement('section');panel.id='proofreaderPanel';panel.className='proofreader-panel';panel.setAttribute('aria-live','polite');
  panel.innerHTML='<div class="proofreader-head"><strong id="proofreaderSummary">Vérification du texte</strong><button type="button" id="proofreaderIgnoreAll">Tout ignorer</button></div><div id="proofreaderList" class="proofreader-list"></div><p class="proofreader-note">Contrôle local : aucune partie du texte n’est envoyée à un service externe. Le soulignement orthographique dépend du navigateur.</p>';
  status.insertAdjacentElement('afterend',panel);
  const list=panel.querySelector('#proofreaderList'),summary=panel.querySelector('#proofreaderSummary');

  function keyFor(code,text,start,source){return code+'|'+text+'|'+source.slice(Math.max(0,start-18),start+text.length+18)}
  function replacementValue(rep,match){return typeof rep==='function'?rep(match):String(rep).replace(/\$(\d+)/g,(_,n)=>match[Number(n)]||'')}
  function analyzeSource(source,target,kind){
    const issues=[];
    function matches(regex,code,label,replacement,filter){
      regex.lastIndex=0;let match;
      while((match=regex.exec(source))){
        if(!filter||filter(match)){
          const found=match[0],key=keyFor(code,found,match.index,source);
          if(!ignored.has(key))issues.push({code,label,found,replacement:replacement==null?null:replacementValue(replacement,match),start:match.index,end:match.index+found.length,target,kind,key});
        }
        if(match[0]==='')regex.lastIndex++
      }
    }
    matches(/\b\d{1,2}[hH]\d{2,3}\b/g,'hour','Format horaire incohérent',m=>{
      const parts=m[0].split(/[hH]/),hour=parts[0].padStart(2,'0'),minutes=parts[1].length===3?parts[1].slice(-2):parts[1];return hour+'h'+minutes
    },m=>!/^\d{2}h\d{2}$/.test(m[0])||Number(m[0].slice(0,2))>23||Number(m[0].slice(-2))>59);
    matches(/([.!?…])([A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ])/g,'space-after-punctuation','Espace manquant après la ponctuation',m=>m[1]+' '+m[2]);
    matches(/(?<!\.)\.\.(?![.?])/g,'double-dot','Deux points seuls', '...');
    matches(/ {2,}/g,'double-space','Espaces répétés',' ');
    matches(/^(\s*)(\d{2}h\d{2})\s+(?=[a-zà-ÿ])/u,'hour-comma','Virgule manquante après l’heure',m=>m[1]+m[2]+', ');
    matches(/\b([\p{L}À-ÿ’'-]+)(\s+)\1\b/giu,'duplicate','Mot répété',m=>m[1],m=>m[1].length>1&&!['nous','vous'].includes(m[1].toLocaleLowerCase('fr')));
    matches(/«\s*»/g,'empty-quotes','Guillemets vides',null);
    matches(/\(\s*\)/g,'empty-parentheses','Parenthèses vides',null);
    matches(/\b([ldjtmnsç]|qu)\s+([’'])/giu,'apostrophe-before','Espace avant une apostrophe',m=>m[1]+m[2]);
    matches(/([’'])\s+([\p{L}À-ÿ])/gu,'apostrophe-after','Espace après une apostrophe',m=>m[1]+m[2]);
    const common=[
      [/\beux(?:\s+|-)mêmes?\b/giu,'eux-memes','Accord ou trait d’union incorrect','eux-mêmes'],
      [/\b(nous|vous)(?:\s+|-)mêmes?\b/giu,'nous-vous-memes','Accord ou trait d’union incorrect',m=>m[1]+'-mêmes'],
      [/\bquelque fois\b/giu,'quelquefois','Mot à souder','quelquefois'],
      [/\bQuelques fois(?=\s*[,.;:!?…])/gu,'quelquefois-plural','Locution adverbiale à souder','Quelquefois'],
      [/\bquelques fois(?=\s*[,.;:!?…])/gu,'quelquefois-plural','Locution adverbiale à souder','quelquefois'],
      [/\bvoir même\b/giu,'voire','Homophone probable','voire même'],
      [/\bvoir(?=\s+(?:me|te|se|nous|vous|les?)\s+[\p{L}À-ÿ’'-]+)/giu,'voire-action','Homophone probable','voire'],
      [/\bvoir(?=\s+(?:maladroites?|douloureuses?|impossibles?|pires?|mieux|davantage)\b)/giu,'voire-adjectif','Homophone probable','voire'],
      [/\b([Uu]ne) (ère|époque|période) ou\b/gu,'ou-accent','Accent manquant',m=>m[1]+' '+m[2]+' où'],
      [/\b(qu[’']il|qu[’']elle|il|elle|on) faillie\b/giu,'faille','Conjugaison incorrecte',m=>m[1]+' faille'],
      [/\bauto-critique\b/giu,'autocritique','Graphie à souder','autocritique'],
      [/\bA peine\b/g,'a-peine','Accent manquant','À peine'],
      [/\bont-il\b/giu,'ont-ils','Accord du sujet','ont-ils'],
      [/\bvivons nous\b/giu,'vivons-nous','Trait d’union manquant','vivons-nous'],
      [/\bun ans\b/giu,'un-an','Accord du nombre','un an'],
      [/\bma épouse\b/giu,'mon-epouse','Déterminant incorrect','mon épouse'],
      [/\bgrand père\b/giu,'grand-pere','Trait d’union manquant','grand-père'],
      [/\bMalheurs à qui\b/gu,'malheur-a-qui','Expression au singulier','Malheur à qui'],
      [/\bmalheurs à qui\b/gu,'malheur-a-qui','Expression au singulier','malheur à qui']
    ];
    common.forEach(([regex,code,label,replacement])=>matches(regex,code,label,replacement));
    return issues
  }
  function collect(){
    const issues=[];
    [title,subtitle].filter(Boolean).forEach(field=>issues.push(...analyzeSource(field.value,field,'field')));
    const walker=document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode()))if(node.data.trim())issues.push(...analyzeSource(node.data,node,'text'));
    return issues
  }
  function locate(issue){
    if(issue.kind==='field'){issue.target.focus();issue.target.setSelectionRange(issue.start,issue.end);return}
    if(!issue.target.isConnected)return scan();
    const range=document.createRange(),selection=window.getSelection();range.setStart(issue.target,issue.start);range.setEnd(issue.target,issue.end);selection.removeAllRanges();selection.addRange(range);issue.target.parentElement?.scrollIntoView({behavior:'smooth',block:'center'});editor.focus()
  }
  function fix(issue){
    if(issue.replacement==null)return;
    if(issue.kind==='field')issue.target.setRangeText(issue.replacement,issue.start,issue.end,'end');
    else if(issue.target.isConnected&&issue.target.data.slice(issue.start,issue.end)===issue.found)issue.target.replaceData(issue.start,issue.found.length,issue.replacement);
    editor.dispatchEvent(new Event('input',{bubbles:true}));scan()
  }
  function scan(open=true){
    const issues=collect();list.replaceChildren();summary.textContent=issues.length?`${issues.length} anomalie${issues.length>1?'s':''} détectée${issues.length>1?'s':''}`:'Aucune anomalie ciblée détectée';
    panel.classList.toggle('open',open||issues.length>0);
    if(!issues.length){const ok=document.createElement('div');ok.className='proofreader-ok';ok.textContent='Le vérificateur local n’a rien repéré. Relis tout de même le fond et les accords complexes.';list.appendChild(ok);return issues}
    issues.forEach(issue=>{
      const row=document.createElement('div');row.className='proofreader-issue';
      const label=document.createElement('div');label.textContent=issue.label;
      const excerpt=document.createElement('code');excerpt.textContent=issue.found+(issue.replacement!=null?'  →  '+issue.replacement:'');
      const actions=document.createElement('div');actions.className='proofreader-actions';
      const locateBtn=document.createElement('button');locateBtn.type='button';locateBtn.textContent='Repérer';locateBtn.onclick=()=>locate(issue);actions.appendChild(locateBtn);
      if(issue.replacement!=null){const fixBtn=document.createElement('button');fixBtn.type='button';fixBtn.textContent='Corriger';fixBtn.onclick=()=>fix(issue);actions.appendChild(fixBtn)}
      const ignoreBtn=document.createElement('button');ignoreBtn.type='button';ignoreBtn.textContent='Ignorer';ignoreBtn.onclick=()=>{ignored.add(issue.key);scan()};actions.appendChild(ignoreBtn);
      row.append(label,excerpt,actions);list.appendChild(row)
    });
    return issues
  }
  let verify=document.getElementById('verifyTextBtn');if(!verify){verify=document.createElement('button');verify.type='button';verify.id='verifyTextBtn';verify.textContent='Vérifier le texte';actions.insertBefore(verify,actions.firstChild)}
  verify.onclick=()=>scan(true);
  panel.querySelector('#proofreaderIgnoreAll').onclick=()=>{collect().forEach(issue=>ignored.add(issue.key));scan(true)};
  function beforePublish(){const issues=scan(true);return !issues.length||confirm(`${issues.length} anomalie${issues.length>1?'s':''} détectée${issues.length>1?'s':''}. Publier malgré tout ?`)}
  return{scan,beforePublish}
}
const proofreader=installProofreader();
async function publish(){
  if(proofreader&&!proofreader.beforePublish())return;
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
    rememberPending(prepared.item);
    say('Publication envoyée : « '+item.title+' ». Déploiement du site en cours…');
    waitForDeployment(prepared.item)
  }catch(e){
    const conflict=/422|fast forward|reference update/i.test(e.message||'');
    say((conflict?'Le site a changé pendant la publication. Réessaie une fois.':e.message)+' — aucune donnée locale n’a été supprimée.')
  }finally{if(direct)direct.disabled=false}
}
let direct=document.getElementById('publishDirectBtn');if(!direct){direct=document.createElement('button');direct.type='button';direct.id='publishDirectBtn';direct.className='admin-primary';direct.textContent='Mettre en ligne sur le site';actions.insertBefore(direct,btn.nextSibling)}direct.onclick=publish;let c=document.getElementById('githubConnectBtn');if(!c){c=document.createElement('button');c.type='button';c.id='githubConnectBtn';c.textContent='Connexion GitHub';actions.appendChild(c)}c.onclick=connect;window.publishPitouToGitHub=publish;
})();
