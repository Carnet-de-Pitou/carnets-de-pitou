(()=>{
const nativeFetch=window.fetch.bind(window),target="Ma Croisade.. ~~ Prophecy, Ultima Online";
function dec(s){const bin=atob((s||'').replace(/\s/g,''));return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)))}
function enc(s){const bytes=new TextEncoder().encode(s);let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin)}
window.fetch=async function(input,init){
 const url=String(input),method=(init?.method||'GET').toUpperCase();
 // GitHub Contents API renvoie content vide au-delà de 1 Mo : relire alors le blob Git complet.
 if(method==='GET'&&url.includes('api.github.com/repos/Carnet-de-Pitou/carnets-de-pitou/contents/library.js')){
   const response=await nativeFetch(input,init);
   try{
     const data=await response.clone().json();
     if(response.ok&&data&&data.sha&&(!data.content||data.content.trim()==='')){
       const token=sessionStorage.getItem('pitou-github-token')||'';
       const br=await nativeFetch(`https://api.github.com/repos/Carnet-de-Pitou/carnets-de-pitou/git/blobs/${data.sha}`,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})}});
       if(br.ok){const blob=await br.json();if(blob?.content){data.content=blob.content;data.encoding=blob.encoding||'base64';return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}})}}
     }
   }catch(e){console.warn('Lecture grande bibliothèque non corrigée',e)}
   return response;
 }
 try{
   if(method==='PUT'&&url.includes('/contents/library.js')){
     const body=JSON.parse(init.body),src=dec(body.content),marker='window.PITOU_PUBLIC_LIBRARY = ',i=src.indexOf(marker);
     if(i>=0){let raw=src.slice(i+marker.length).trim();if(raw.endsWith(';'))raw=raw.slice(0,-1);const list=JSON.parse(raw),slug=document.getElementById('edOriginalSlug')?.value||((document.getElementById('edTitle')?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'texte'),cat=document.getElementById('edCategory')?.value||'',series=document.getElementById('edSeries')?.value||'',item=list.find(t=>t&&t.slug===slug);if(item){if(cat===target&&series)item.series=series;else delete item.series}body.content=enc(marker+JSON.stringify(list)+';\n');init={...init,body:JSON.stringify(body)}}
   }
 }catch(e){console.warn('Sous-section non injectée',e)}
 return nativeFetch(input,init)
};
})();