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