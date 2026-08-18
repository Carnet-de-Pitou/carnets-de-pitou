(() => {
  const audio = document.getElementById('siteAmbience');
  const button = document.getElementById('soundToggle');
  if (!audio || !button) return;

  audio.volume = 0.38;

  function display(enabled) {
    button.textContent = enabled ? '♪ Ambiance : ON' : '♪ Ambiance : OFF';
    button.classList.toggle('on', enabled);
    button.setAttribute('aria-pressed', String(enabled));
  }

  async function start() {
    try {
      await audio.play();
      localStorage.setItem('pitou-ambience', 'on');
      display(true);
    } catch (error) {
      display(false);
    }
  }

  function stop() {
    audio.pause();
    localStorage.setItem('pitou-ambience', 'off');
    display(false);
  }

  button.addEventListener('click', () => {
    if (audio.paused) start();
    else stop();
  });

  // Les navigateurs interdisent généralement le son automatique avant
  // une interaction. Si le visiteur avait choisi ON, on reprend au
  // premier clic/toucher/touche de sa prochaine visite.
  if (localStorage.getItem('pitou-ambience') === 'on') {
    const resume = () => start();
    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
  }

  display(false);
})();
