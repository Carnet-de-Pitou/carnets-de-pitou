(()=>{
const nativeFetch=window.fetch.bind(window);
window.fetch=async function(input,init){
  const response=await nativeFetch(input,init);
  try{
    const url=typeof input==='string'?input:(input&&input.url)||String(input);
    const method=(init?.method||(input&&input.method)||'GET').toUpperCase();
    if(method==='GET'&&url.includes('api.github.com/repos/Carnet-de-Pitou/carnets-de-pitou/contents/library.js')){
      const clone=response.clone(),data=await clone.json();
      const unusable=!data.content||!String(data.content).trim()||data.encoding==='none';
      if(response.ok&&data&&data.sha&&unusable){
        const token=sessionStorage.getItem('pitou-github-token')||'';
        const blobResponse=await nativeFetch(`https://api.github.com/repos/Carnet-de-Pitou/carnets-de-pitou/git/blobs/${data.sha}`,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:'Bearer '+token}:{})}});
        if(!blobResponse.ok)return response;
        const blob=await blobResponse.json();
        if(blob&&blob.content){data.content=blob.content;data.encoding=blob.encoding||'base64';return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}})}
      }
    }
  }catch(e){console.warn('Correctif grande bibliothèque non appliqué',e)}
  return response;
};
})();
