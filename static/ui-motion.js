(() => {
  const selector = '.metric strong, .metric-value, .dashboard-metrics strong, .season-summary b, .config-metric b';
  const loadingSelector = '#status, #configStatus, #authMessage, .loading-inline, .match-detail .muted';
  const loadingText = /(aranıyor|yükleniyor|kontrol ediliyor|hazırlanıyor|alınıyor)/i;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCounter(element) {
    if (reducedMotion || element.dataset.countupDone || element.dataset.countupRunning) return;
    const original = element.textContent.trim();
    const match = original.match(/^([%]?)(-?\d+(?:[.,]\d+)?)(.*)$/);
    if (!match) return;
    const prefix = match[1];
    const target = Number(match[2].replace(',', '.'));
    if (!Number.isFinite(target) || Math.abs(target) > 1000000 || /[/:x×]/i.test(match[3])) return;
    const decimals = (match[2].split(/[.,]/)[1] || '').length;
    const suffix = match[3];
    const separator = match[2].includes(',') ? ',' : '.';
    const duration = 720;
    const start = performance.now();
    element.dataset.countupRunning = 'true';

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      const rendered = decimals ? value.toFixed(decimals).replace('.', separator) : String(Math.round(value));
      element.textContent = `${prefix}${rendered}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
      else {
        element.textContent = original;
        element.dataset.countupRunning = '';
        element.dataset.countupDone = 'true';
      }
    }
    requestAnimationFrame(frame);
  }

  function syncLoading(element) {
    if (!element.matches(loadingSelector)) return;
    const busy = loadingText.test(element.textContent || '');
    element.classList.toggle('loading', busy);
    if (element.matches('.match-detail .muted')) element.classList.toggle('loading-inline', busy);
  }

  function scan(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.matches(selector)) animateCounter(root);
    root.querySelectorAll(selector).forEach(animateCounter);
    syncLoading(root);
    root.querySelectorAll(loadingSelector).forEach(syncLoading);
  }

  scan(document.body);
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(scan);
      if (record.target.nodeType === Node.ELEMENT_NODE) {
        const counter = record.target.closest(selector);
        if (counter) animateCounter(counter);
        const loading = record.target.closest(loadingSelector);
        if (loading) syncLoading(loading);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
})();