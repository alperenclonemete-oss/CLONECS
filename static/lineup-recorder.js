(() => {
  const choose = document.getElementById('choose-game');
  const stop = document.getElementById('stop-clip');
  const status = document.getElementById('clip-status');
  const clock = document.getElementById('clip-clock');
  const nameInput = document.getElementById('clip-name');
  const lengthInput = document.getElementById('clip-length');
  const result = document.getElementById('clip-result');
  const preview = document.getElementById('clip-preview');
  const download = document.getElementById('clip-download');
  const size = document.getElementById('clip-size');
  const maxBytes = 32 * 1024 * 1024;
  const startDelay = 5000;
  const supportedType = ['video/webm;codecs=vp8', 'video/mp4', 'video/webm']
    .find(type => window.MediaRecorder?.isTypeSupported?.(type));
  let active = null;
  let clipUrl = '';

  function announce(message, error = false) {
    status.textContent = message;
    status.toggleAttribute('data-error', error);
  }

  function fileStem(value) {
    return value.trim().toLocaleLowerCase('tr').replaceAll('ı', 'i')
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'clone-lab-lineup';
  }

  function renderClock(session, deadline) {
    clearInterval(session.clock);
    clock.hidden = false;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
      clock.textContent = '00:' + String(seconds).padStart(2, '0');
    };
    tick();
    session.clock = setInterval(tick, 250);
  }

  function release(session) {
    clearTimeout(session.timer);
    clearInterval(session.clock);
    session.stream?.getTracks().forEach(track => track.stop());
  }

  function finish(session, message, error = false) {
    if (active !== session) return;
    active = null;
    release(session);
    choose.disabled = false;
    nameInput.disabled = false;
    lengthInput.disabled = false;
    stop.hidden = true;
    stop.disabled = false;
    clock.hidden = true;
    announce(message, error);
  }

  function stopCapture(session) {
    if (active !== session) return;
    if (!session.recorder) {
      finish(session, 'Kayıt başlamadan iptal edildi.');
      return;
    }
    clearTimeout(session.timer);
    clearInterval(session.clock);
    stop.disabled = true;
    announce('Klip hazırlanıyor…');
    if (session.recorder.state !== 'inactive') session.recorder.stop();
    session.stream.getTracks().forEach(track => track.stop());
  }

  function saveResult(session) {
    if (active !== session) return;
    if (session.error) {
      finish(session, session.error, true);
      return;
    }
    if (!session.bytes) {
      finish(session, 'Görüntü kaydedilemedi. CS2 penceresi açıkken tekrar dene.', true);
      return;
    }
    const mime = session.recorder.mimeType.split(';')[0];
    if (!['video/webm', 'video/mp4'].includes(mime)) {
      finish(session, 'Tarayıcı MP4 veya WebM klip üretemedi.', true);
      return;
    }
    const clip = new Blob(session.chunks, {type: mime});
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    clipUrl = URL.createObjectURL(clip);
    preview.src = clipUrl;
    download.href = clipUrl;
    download.download = session.name + (mime === 'video/mp4' ? '.mp4' : '.webm');
    size.textContent = (clip.size / 1024 / 1024).toLocaleString('tr-TR', {maximumFractionDigits: 1}) + ' MB';
    result.hidden = false;
    finish(session, 'Klip hazır. İndirmeden önce görüntüyü kontrol et.');
  }

  function beginRecording(session) {
    if (active !== session) return;
    try {
      session.recorder = new MediaRecorder(session.stream, {mimeType: supportedType, videoBitsPerSecond: 2500000});
      session.recorder.addEventListener('dataavailable', ({data}) => {
        if (!data.size || session.error) return;
        if (session.bytes + data.size > maxBytes) {
          session.error = 'Klip 32 MB sınırını aştı. Daha kısa süre seç.';
          stopCapture(session);
          return;
        }
        session.bytes += data.size;
        session.chunks.push(data);
      });
      session.recorder.addEventListener('stop', () => saveResult(session), {once: true});
      session.recorder.addEventListener('error', () => finish(session, 'Kayıt kesildi. CS2 penceresini yeniden seç.', true), {once: true});
      session.recorder.start(500);
    } catch {
      finish(session, 'Tarayıcı seçilen pencereyi kaydedemedi. Chrome veya Edge ile tekrar dene.', true);
      return;
    }
    const duration = session.seconds * 1000;
    stop.textContent = 'Kaydı durdur';
    announce('Kayıt açık. Atışını göster.');
    renderClock(session, performance.now() + duration);
    session.timer = setTimeout(() => stopCapture(session), duration);
  }

  if (!navigator.mediaDevices?.getDisplayMedia || !supportedType) {
    choose.disabled = true;
    announce('Bu tarayıcı pencere kaydını desteklemiyor. Bilgisayarda Chrome veya Edge ile aç.', true);
    return;
  }

  choose.addEventListener('click', async () => {
    if (active) return;
    const seconds = Number(lengthInput.value);
    const session = {name: fileStem(nameInput.value), seconds: [10, 15, 20, 30].includes(seconds) ? seconds : 15, chunks: [], bytes: 0};
    active = session;
    choose.disabled = true;
    nameInput.disabled = true;
    lengthInput.disabled = true;
    announce('Tarayıcının paylaşım penceresinde Counter-Strike 2’yi seç.');
    try {
      session.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {displaySurface: 'window', width: {ideal: 1280}, height: {ideal: 720}, frameRate: {ideal: 30, max: 30}},
        audio: false,
        monitorTypeSurfaces: 'exclude',
        selfBrowserSurface: 'exclude',
        surfaceSwitching: 'exclude',
      });
      if (active !== session) {
        release(session);
        return;
      }
      const [track] = session.stream.getVideoTracks();
      if (track?.getSettings().displaySurface !== 'window') {
        finish(session, 'Pencere seçmen gerekiyor. Paylaşım listesinde Counter-Strike 2 penceresini seç.', true);
        return;
      }
      track.addEventListener('ended', () => {
        if (session.recorder) stopCapture(session);
        else finish(session, 'Pencere paylaşımı kayıt başlamadan kapandı.');
      }, {once: true});
      stop.hidden = false;
      stop.textContent = 'İptal et';
      announce('Oyuna dön. Kayıt 5 saniye içinde başlayacak.');
      renderClock(session, performance.now() + startDelay);
      session.timer = setTimeout(() => beginRecording(session), startDelay);
    } catch (error) {
      const cancelled = error.name === 'NotAllowedError' || error.name === 'AbortError';
      finish(session, cancelled ? 'Pencere paylaşımı başlatılmadı.' : 'Pencere açılamadı. CS2 açıkken tekrar dene.', !cancelled);
    }
  });
  stop.addEventListener('click', () => { if (active) stopCapture(active); });
  window.addEventListener('pagehide', () => {
    if (!active) return;
    finish(active, 'Pencere paylaşımı durduruldu.');
  });
})();
