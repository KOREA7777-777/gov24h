document.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('[data-more-toggle], #btnMore');
    const more = document.querySelector('[data-more-grid], #data-more-grid, #gridMore');
    const label = document.querySelector('[data-more-label], #btnMore .label');
    const icon = document.querySelector('[data-more-icon]');

    if (btn && more) {
        btn.setAttribute('aria-expanded', 'false');
        more.classList.add('is-hidden');

        document.addEventListener('click', (ev) => {
            const t = ev.target.closest('.more-toggle, #btnMore');
            if (!t) return;
            ev.preventDefault();

            if (label) label.textContent = next ? '접기' : '더보기';
            if (icon) icon.src = next ? './assets/icons/minus.svg' : './assets/icons/plus.svg';
        });
    }

    const btnFooter = document.getElementById('btnFooter');
    const footerPanel = document.getElementById('footerPanel');
    if (btnFooter && footerPanel) {
        btnFooter.addEventListener('click', () => {
            const expanded = btnFooter.getAttribute('aria-expanded') === 'true';
            btnFooter.setAttribute('aria-expanded', String(!expanded));
            footerPanel.classList.toggle('is-hidden');
        });
    }

    const overlay = document.getElementById('precheck');
    const back = document.getElementById('precheckBackdrop');
    const confirm = document.getElementById('btnPrecheckConfirm');
    const btnMobID = document.getElementById('btnMobileID');
    if (overlay) {
        const open = () => overlay.classList.remove('is-hidden');
        const close = () => overlay.classList.add('is-hidden');
        btnMobID?.addEventListener('click', open);
        back?.addEventListener('click', close);
        confirm?.addEventListener('click', close);
    }

    const btnChannel = document.getElementById('btnChannel');
    const channelPanel = document.getElementById('channelPanel');
    if (btnChannel && channelPanel) {
        btnChannel.setAttribute('aria-expanded', 'false');
        channelPanel.classList.add('is-hidden');
        btnChannel.addEventListener('click', () => {
            const expanded = btnChannel.getAttribute('aria-expanded') === 'true';
            btnChannel.setAttribute('aria-expanded', String(!expanded));
            channelPanel.classList.toggle('is-hidden');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
  const btn  = document.querySelector('.frequent-services .more-toggle');
  const grid = document.getElementById('data-more-grid');

  if (!btn || !grid) return;

  const label = btn.querySelector('[data-more-label], .label');
  const icon  = btn.querySelector('[data-more-icon], .plus-icon');

  const isClosed = grid.classList.contains('is-hidden');
  btn.setAttribute('aria-expanded', String(!isClosed));

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const open = btn.getAttribute('aria-expanded') === 'true';
    const next = !open;

    btn.setAttribute('aria-expanded', String(next));
    grid.classList.toggle('is-hidden', !next);

    if (label) label.textContent = next ? '접기' : '더보기';
    if (icon)  icon.src         = next ? './assets/icons/minus.svg' : './assets/icons/plus.svg';
  });
});

