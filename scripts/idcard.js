(function () {
  const idcardRoot = document.getElementById('cardNormal');
  if (!idcardRoot) return;

  const $ = (sel) => document.querySelector(sel);
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? ''; };
  const setSrc = (id, v) => { const el = document.getElementById(id); if (el && v) el.src = v; };
  const onlyNum = (v) => String(v || '').replace(/[^0-9]/g, '');
  const maskBack = (back) => {
    const n = String(back || '');
    if (!n) return '*******';
    return '*'.repeat(Math.max(7, n.length));
  };

  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('[idcard.js] Supabase client not found.');
    try { location.replace('../pages/beforelogin.html'); } catch (e) { }
    return;
  }

  async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  }

  async function loadProfile(userId) {

    const { data: prof, error: pErr } = await supabase
      .from('profiles')
      .select('user_name, addr1, addr2, addr3, issue_date, issuer, photo_url, status')
      .eq('user_id', userId)
      .maybeSingle();
    if (pErr) { console.warn('[idcard] profiles error:', pErr); }
    if (!prof || String(prof.status || '').toLowerCase() !== 'approved') {
      return { blocked: true };
    }

    const { data: rrn, error: rErr } = await supabase
      .from('sensitive_rrn')
      .select('rrn_front, rrn_back')
      .eq('user_id', userId)
      .maybeSingle();
    if (rErr) { console.warn('[idcard] rrn error:', rErr); }

    return { prof, rrn };
  }

  function formatDotDate(isoOrYmd) {
    if (!isoOrYmd) return '';
    const s = String(isoOrYmd);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}.${m[2]}.${m[3]}`;
    return s.replace(/-/g, '.');
  }

  const detailToggle = document.getElementById('detailToggle');
  const maskToggleEl = document.getElementById('maskToggle');
  function applyToggleState(on, rrnFront, rrnBack, addr1, addr2, addr3) {
    setText('rrnText', rrnFront ? `${rrnFront}-${on ? rrnBack : maskBack(rrnBack)}` : '000000-*******');
    setText('rrnFront', rrnFront || '000000');
    setText('rrnTail', on ? rrnBack : maskBack(rrnBack));

    const shortAddr = [addr1, addr2].filter(Boolean).join(' ');
    const fullAddr = [addr1, addr2, addr3].filter(Boolean).join(' ');
    const addrVis = document.getElementById('addr');
    if (addrVis) addrVis.textContent = on ? fullAddr : shortAddr;
    setText('addrText', on ? fullAddr : shortAddr);

    document.dispatchEvent(new Event('gw:updateRRNAddr'));
  }
  function syncToggles(from, to, ctx) {
    if (to && to.checked !== from.checked) to.checked = from.checked;
    applyToggleState(from.checked, ctx.rrnFront, ctx.rrnBack, ctx.addr1, ctx.addr2, ctx.addr3);
  }

  const toggleState = {
    ctx: { rrnFront: '', rrnBack: '', addr1: '', addr2: '', addr3: '' },
    listenersBound: false,
  };
  function ensureToggleListeners() {
    if (toggleState.listenersBound) return;
    if (detailToggle) detailToggle.addEventListener('change', () => syncToggles(detailToggle, maskToggleEl, toggleState.ctx));
    if (maskToggleEl) maskToggleEl.addEventListener('change', () => syncToggles(maskToggleEl, detailToggle, toggleState.ctx));
    toggleState.listenersBound = true;
  }
  function updateToggleContext(newCtx) {
    toggleState.ctx = newCtx;
    ensureToggleListeners();
    const desired = (detailToggle?.checked ?? maskToggleEl?.checked) ?? false;
    if (detailToggle) detailToggle.checked = desired;
    if (maskToggleEl) maskToggleEl.checked = desired;
    applyToggleState(desired, newCtx.rrnFront, newCtx.rrnBack, newCtx.addr1, newCtx.addr2, newCtx.addr3);
  }

  function renderCard(rawProf = {}, rawRrn = {}) {
    const prof = rawProf || {};
    const rrnSrc = rawRrn || {};

    const name = (prof.user_name ?? prof.name ?? '').trim();
    const addr1 = (prof.addr1 ?? prof.address1 ?? prof.addr_1 ?? '').trim();
    const addr2 = (prof.addr2 ?? prof.address2 ?? prof.addr_2 ?? '').trim();
    const addr3 = (prof.addr3 ?? prof.address3 ?? prof.addr_3 ?? '').trim();
    const region = [addr1, addr2].filter(Boolean).join(' ') || (prof.region ?? prof.residence ?? prof.city ?? '').trim();

    const rrnFrontRaw =
      rrnSrc.rrn_front ??
      rrnSrc.front ??
      rrnSrc.rrnFront ??
      rrnSrc.front_part ??
      rrnSrc.frontPart ??
      prof.rrn_front ??
      '';
    const rrnBackRaw =
      rrnSrc.rrn_back ??
      rrnSrc.back ??
      rrnSrc.rrnBack ??
      rrnSrc.back_part ??
      rrnSrc.backPart ??
      prof.rrn_back ??
      '';
    const rrnFront = onlyNum(rrnFrontRaw).slice(0, 6);
    const rrnBack = onlyNum(rrnBackRaw).slice(0, 7);

    setText('name', name);
    setText('region', region);
    setText('cardName', name);
    setText('cardRegion', region);
    setText('dNameVis', name);

    setText('rrnFront', rrnFront || '000000');
    setText('rrnTail', maskBack(rrnBack));
    setText('rrnText', rrnFront ? `${rrnFront}-${maskBack(rrnBack)}` : '000000-*******');

    const shortAddr = [addr1, addr2].filter(Boolean).join(' ');
    setText('addr', shortAddr);
    setText('addrText', shortAddr);

    const issueDateRaw = prof.issue_date ?? prof.issueDate ?? prof.issue_date_text ?? prof.issueDateText ?? '';
    const dotDate = formatDotDate(issueDateRaw);
    if (dotDate) {
      setText('issueDate', dotDate);
      setText('issueDateText', dotDate);
    } else {
      setText('issueDate', '');
      setText('issueDateText', '');
    }

    const issuer = prof.issuer ?? prof.issuing_agency ?? prof.issue_agency ?? prof.issuerName ?? '';
    setText('issuer', issuer || '');
    setText('issuerText', issuer || '');

    const photoUrl = prof.photo_url ?? prof.photoUrl ?? prof.photo ?? prof.image_url ?? '';
    if (photoUrl) {
      setSrc('cardPhoto', photoUrl);
      setSrc('cardPhotoDetail', photoUrl);

      const imgN = document.getElementById('cardPhoto');
      if (imgN) {
        imgN.classList.remove('is-hidden');
        const phN = document.querySelector('#profileBox .placeholder');
        if (phN) phN.style.display = 'none';
      }

      const imgD = document.getElementById('cardPhotoDetail');
      if (imgD) {
        imgD.classList.remove('is-hidden');
        const phD = document.querySelector('#profileBoxDetail .placeholder');
        if (phD) phD.style.display = 'none';
      }
    } else {
      const imgN = document.getElementById('cardPhoto');
      if (imgN) {
        imgN.classList.add('is-hidden');
        const phN = document.querySelector('#profileBox .placeholder');
        if (phN) phN.style.display = '';
      }
      const imgD = document.getElementById('cardPhotoDetail');
      if (imgD) {
        imgD.classList.add('is-hidden');
        const phD = document.querySelector('#profileBoxDetail .placeholder');
        if (phD) phD.style.display = '';
      }
    }

    updateToggleContext({ rrnFront, rrnBack, addr1, addr2, addr3 });
  }

  async function bootstrap() {
    const user = await getCurrentUser();
    if (!user) { try { location.replace('../pages/beforelogin.html'); } catch (e) { } throw new Error('no-user'); }

    const loaded = await loadProfile(user.id);
    if (loaded?.blocked) { try { location.replace('../pages/beforelogin.html'); } catch (e) { } throw new Error('blocked'); }

    const prof = loaded.prof || {};
    const rrn = loaded.rrn || {};

    renderCard(prof, rrn);
  }

  async function loadApiProfile() {
    const res = await fetch('/api/profile', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const unwrap = (value) => {
      let current = value;
      while (current && typeof current === 'object' && 'data' in current && current.data) {
        current = current.data;
      }
      return current;
    };
    const asRecord = (value) => {
      if (!value) return null;
      const unwrapped = unwrap(value);
      if (!unwrapped) return null;
      if (Array.isArray(unwrapped)) return unwrapped[0] ?? null;
      return unwrapped;
    };

    const payload = unwrap(data) || {};
    const prof =
      asRecord(payload.profile ?? payload.prof ?? payload.profiles) ||
      (payload.user_name ? payload : null) ||
      {};
    const rrn =
      asRecord(payload.rrn ?? payload.rrnData ?? payload.sensitive_rrn) ||
      (payload.rrn_front || payload.rrn_back ? payload : null) ||
      prof;

    renderCard(prof, rrn);
  }

  (function orchestrateLoading() {
    try { if (typeof window.showLoading === 'function') window.showLoading(); } catch (e) {}
    Promise.allSettled([ bootstrap(), loadApiProfile() ])
      .then(function () {
        try { if (typeof window.hideLoading === 'function') window.hideLoading(); } catch (e) {}
      });
  })();
})();
