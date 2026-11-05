// No page bridge or message data here. Background reads the count itself.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (globalThis.tabHeroHeartbeat) return;
  globalThis.tabHeroHeartbeat = true;
  let timer;
  const beat = () => {
    try { api.runtime.sendMessage({ type: 'qr-heartbeat' }).catch(() => {}); }
    catch { clearInterval(timer); document.removeEventListener('visibilitychange', beat); }
  };
  beat();
  timer = setInterval(beat, 15000);
  document.addEventListener('visibilitychange', beat);
})();
