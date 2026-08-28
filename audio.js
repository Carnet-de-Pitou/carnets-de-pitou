(() => {
  const audio = document.getElementById('siteAmbience');
  const button = document.getElementById('soundToggle');
  if (!audio || !button) return;

  const DEFAULT_TRACK = 'assets/ambiance-carnets-de-pitou-v2-1.mp3';
  const CATEGORY_TRACKS = {
    'Les Sentiers du Salut ~~ Rift': 'assets/rift-drelnas-1.mp3'
  };

  audio.volume = 0.38;

  function display(enabled) {
    button.textContent = enabled ? '♪ Ambiance : ON' : '♪ Ambiance : OFF';
    button.classList.toggle('on', enabled);
    button.setAttribute('aria-pressed', String(enabled));
  }

  async function start() {
    display(true);
    localStorage.setItem('pitou-ambience', 'on');
    try {
      await audio.play();
    } catch (error) {
      display(false);
      localStorage.setItem('pitou-ambience', 'off');
      console.error('Lecture ambiance impossible :', error);
    }
  }

  function stop() {
    audio.pause();
    localStorage.setItem('pitou-ambience', 'off');
    display(false);
  }

  async function selectCategory(category) {
    const nextTrack = CATEGORY_TRACKS[category] || DEFAULT_TRACK;
    const currentTrack = audio.getAttribute('src') || audio.querySelector('source')?.getAttribute('src') || DEFAULT_TRACK;
    if (currentTrack === nextTrack) return;

    const shouldResume = localStorage.getItem('pitou-ambience') === 'on';
    audio.pause();
    audio.src = nextTrack;
    audio.load();
    if (shouldResume) await start();
  }

  window.PITOU_SET_AMBIENCE = selectCategory;

  const reader = document.getElementById('reader');
  const readerMeta = document.getElementById('readerMeta');
  if (reader && readerMeta) {
    const syncReaderAmbience = () => {
      const closed = reader.getAttribute('aria-hidden') === 'true' || reader.style.display === 'none';
      const category = closed ? null : Object.keys(CATEGORY_TRACKS).find(name => readerMeta.textContent.startsWith(name));
      selectCategory(category || null);
    };
    const observer = new MutationObserver(syncReaderAmbience);
    observer.observe(reader, { attributes: true, attributeFilter: ['style', 'aria-hidden'] });
    observer.observe(readerMeta, { childList: true, characterData: true, subtree: true });
  }

  button.addEventListener('click', (event) => {
    event.preventDefault();
    if (audio.paused) start();
    else stop();
  });

  const remembered = localStorage.getItem('pitou-ambience') === 'on';
  display(remembered && !audio.paused);

  if (remembered) {
    const resume = () => {
      if (audio.paused) start();
    };
    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  }
})();
