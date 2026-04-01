(function () {
  const TABBAR_HTML = [
    '<nav class="tabbar" id="tabbar" role="navigation" aria-label="하단 메뉴">',
    '  <a class="tabbar-item" href="/">',
    '    <img class="tabbar-ico" src="/assets/icons/person-icon.svg" alt="" />',
    '    <span class="tabbar-label">MyGOV</span>',
    '  </a>',
    '  <a class="tabbar-item" href="#">',
    '    <img class="tabbar-ico" src="/assets/icons/clipboard-import.svg" alt="" />',
    '    <span class="tabbar-label">주제별 보기</span>',
    '  </a>',
    '  <a class="tabbar-item" href="#">',
    '    <img class="tabbar-ico" src="/assets/icons/password-check.svg" alt="" />',
    '    <span class="tabbar-label">문서진위확인</span>',
    '  </a>',
    '  <a class="tabbar-item" href="#">',
    '    <img class="tabbar-ico" src="/assets/icons/gift.svg" alt="" />',
    '    <span class="tabbar-label">혜택알림</span>',
    '  </a>',
    '</nav>'
  ].join('\n');

  const EVENTS_TO_RELOCK = [
    'scroll',
    'resize',
    'orientationchange',
    'focus',
    'blur',
    'pageshow',
    'visibilitychange'
  ];

  function normalizePath(pathname) {
    if (!pathname) return '/';
    let trimmed = pathname;
    if (trimmed.endsWith('/index.html')) trimmed = trimmed.slice(0, -'/index.html'.length);
    if (!trimmed) trimmed = '/';
    if (trimmed.length > 1 && trimmed.endsWith('/')) trimmed = trimmed.slice(0, -1);
    return trimmed;
  }

  function ensureTabbar() {
    let tb = document.getElementById('tabbar');
    if (tb) return tb;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = TABBAR_HTML;
    tb = wrapper.firstElementChild;
    if (!tb) return null;
    document.body.appendChild(tb);
    return tb;
  }

  function markActiveLink(tb) {
    const current = normalizePath(location.pathname);
    tb.querySelectorAll('.tabbar-item').forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') {
        anchor.removeAttribute('aria-current');
        return;
      }
      const resolved = normalizePath(new URL(href, location.origin).pathname);
      if (resolved === current) anchor.setAttribute('aria-current', 'page');
      else anchor.removeAttribute('aria-current');
    });
  }

  function applyFixedStyles(tb) {
    tb.style.setProperty('position', 'fixed', 'important');
    tb.style.setProperty('left', '0', 'important');
    tb.style.setProperty('right', '0', 'important');
    tb.style.setProperty('top', 'auto', 'important');
    tb.style.setProperty('bottom', '0', 'important');
    tb.style.setProperty('transform', 'none', 'important');
    tb.style.setProperty('will-change', 'auto');
    tb.style.setProperty('z-index', '1000', 'important');
    tb.style.width = '100%';
  }

  function lockTabbar(tb) {
    if (!tb) return;
    if (tb.parentNode !== document.body) {
      document.body.appendChild(tb);
    }
    document.documentElement.style.setProperty('transform', 'none', 'important');
    document.body.style.setProperty('transform', 'none', 'important');
    document.body.style.setProperty('position', 'static', 'important');
    applyFixedStyles(tb);
  }

  function syncTabbarMetrics(tb) {
    if (!tb) return;
    try {
      const rect = tb.getBoundingClientRect();
      if (rect && rect.height) {
        const h = Math.round(rect.height);
        if (h > 0) {
          document.documentElement.style.setProperty('--tabbar-lock-height', `${h}px`);
        }
      }
    } catch (_) { /* no-op */ }
  }

  function lockAndSync(tb) {
    lockTabbar(tb);
    syncTabbarMetrics(tb);
  }

  function init() {
    const tb = ensureTabbar();
    if (!tb) return;
    lockAndSync(tb);
    markActiveLink(tb);

    EVENTS_TO_RELOCK.forEach((evt) => {
      window.addEventListener(evt, () => lockAndSync(tb), { passive: true });
    });

    const mo = new MutationObserver(() => lockAndSync(tb));
    mo.observe(tb, { attributes: true, attributeFilter: ['style', 'class'] });

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', () => lockAndSync(tb), { passive: true });
      vv.addEventListener('scroll', () => lockAndSync(tb), { passive: true });
    }

    window.addEventListener('hashchange', () => markActiveLink(tb));
    window.addEventListener('popstate', () => markActiveLink(tb));
    window.addEventListener('pageshow', (e) => {
      if (e && e.persisted) {
        setTimeout(() => lockAndSync(tb), 0);
      }
    }, true);

    let rafId = 0;
    function tick() {
      lockAndSync(tb);
      rafId = window.requestAnimationFrame(tick);
    }
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener('beforeunload', () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
