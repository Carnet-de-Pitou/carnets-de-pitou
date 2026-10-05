(() => {
  const reader=document.getElementById('reader');
  if(!reader)return;
  function prepare(){
    if(reader.classList.contains('seo-reader')||reader.style.display==='block')document.body.classList.add('pitou-print-reader');
  }
  window.addEventListener('beforeprint',prepare);
  window.addEventListener('afterprint',()=>document.body.classList.remove('pitou-print-reader'));
  reader.querySelectorAll('[data-print-text]').forEach(button=>button.addEventListener('click',()=>{
    if(button.disabled)return;
    prepare();
    try{window.print()}catch(error){document.body.classList.remove('pitou-print-reader');throw error}
  }));
})();
