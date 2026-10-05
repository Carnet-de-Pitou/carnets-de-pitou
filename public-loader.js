(() => {
  const version = '20261005-lazy1';
  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${src}?v=${version}`;
    script.onload = resolve;
    script.onerror = () => { script.remove(); reject(new Error(`Chargement impossible: ${src}`)); };
    document.body.appendChild(script);
  });
  const contents = new Map();
  // Les scripts de textes utilisent une variable globale partagée : les sérialiser.
  let scriptQueue = Promise.resolve();
  window.PITOU_LOAD_CONTENT = item => {
    if (item.html) return Promise.resolve(item.html);
    if (contents.has(item.slug)) return contents.get(item.slug);
    let pending;
    if (item.contentFormat === 'script') {
      pending = scriptQueue.then(async () => {
        window.PITOU_LIBRARY_ITEM = null;
        await loadScript(item.contentPath);
        const loaded = window.PITOU_LIBRARY_ITEM;
        if (!loaded || loaded.slug !== item.slug || typeof loaded.html !== 'string') throw new Error('Texte invalide');
        return loaded.html;
      });
      scriptQueue = pending.catch(() => {});
    } else if (item.contentFormat === 'json') {
      pending = fetch(`${item.contentPath}?v=${version}`).then(response => {
        if (!response.ok) throw new Error('Texte indisponible');
        return response.json();
      }).then(data => {
        if (typeof data.html !== 'string') throw new Error('Texte invalide');
        return data.html;
      });
    } else {
      pending = fetch(`texts/${encodeURIComponent(item.slug)}.html`).then(response => {
        if (!response.ok) throw new Error('Texte indisponible');
        return response.text();
      }).then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return (doc.querySelector('.article') || doc.querySelector('article') || doc.body).innerHTML;
      });
    }
    contents.set(item.slug, pending);
    pending.catch(() => { if (contents.get(item.slug) === pending) contents.delete(item.slug); });
    return pending;
  };
  (async () => {
    await loadScript('public-catalog.js');
    const map = new Map(window.PITOU_PUBLIC_CATALOG.map(item => [item.slug, { ...item, local: false }]));
    TEXTS.splice(0, TEXTS.length, ...map.values());
    window.PITOU_PUBLIC_LIBRARY = TEXTS;
    await loadScript('app.js');
    await loadScript('series-site.js');
    await loadScript('journal-reconquete-order.js');
    await loadScript('visual-polish.js');
    await loadScript('audio.js');
  })().catch(error => {
    console.error('Ouverture des Carnets:', error);
    const box = document.getElementById('cards');
    const message = document.createElement('p');
    message.textContent = 'Impossible de charger les Carnets. ';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Réessayer';
    retry.onclick = () => location.reload();
    message.appendChild(retry);
    box.replaceChildren(message);
  });
})();
