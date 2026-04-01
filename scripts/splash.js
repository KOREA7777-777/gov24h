const DURATION = 1800;
const TICK = 50;
const NEXT_URL = (() => {
  const p = window.location.pathname;
  if (p.includes('/pages/')) return '../index.html';
  return 'index.html';
})();

if (window.__splashStarted) {
} else {
  window.__splashStarted = true;
}


function startProgress(){
  const bar = document.getElementById("progressBar");
  const hint = document.getElementById("progressHint");
  if(!bar) return;

  const started = performance.now();
  const timer = setInterval(() => {
    const elapsed = performance.now() - started;
    let pct = Math.min(100, Math.round((elapsed / DURATION) * 100));
    bar.style.width = pct + "%";

    if (hint && pct >= 90) hint.textContent = "마무리 중…";

    if (pct >= 100){
      clearInterval(timer);
      setTimeout(() => {
        window.location.replace(NEXT_URL);
      }, 120);
    }
  }, TICK);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startProgress);
} else {
  startProgress();
}