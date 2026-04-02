(function () {
  const $ = (sel) => document.querySelector(sel);
  const $id = $('#loginId');
  const $pw = $('#loginPw');
  const $pwBlock = $('#pwBlock');
  const $idErr = $('#idError');
  const $pwErr = $('#pwError');
  const $next = document.querySelector('.primary-btn');
  const $saveId = document.querySelector('.checkline input[type="checkbox"]');

  const supabase = window.supabaseClient;
  if (!supabase) {
    console.error('[login.js] Supabase client not found. Make sure supabase.config.js is included before this file.');
  }

  function openPwBlock(open) {
    if (!$pwBlock) return;
    if (open) {
      $pwBlock.classList.add('is-open');
      $pwBlock.classList.remove('is-collapsed');
      $pwBlock.setAttribute('aria-hidden', 'false');
    } else {
      $pwBlock.classList.remove('is-open');
      $pwBlock.classList.add('is-collapsed');
      $pwBlock.setAttribute('aria-hidden', 'true');
      if ($pw) $pw.value = '';
      if ($pwErr) $pwErr.textContent = '';
    }
  }
  function showIdError(msg) { if ($idErr) $idErr.textContent = msg || ''; }
  function showPwError(msg) { if ($pwErr) $pwErr.textContent = msg || ''; }

  (function initSavedId() {
    if (!$id || !$saveId) return;
    const saved = localStorage.getItem('gw_saved_id') || '';
    if (saved) { $id.value = saved; $saveId.checked = true; }
  })();
  if ($saveId && $id) {
    $saveId.addEventListener('change', () => {
      if ($saveId.checked) localStorage.setItem('gw_saved_id', $id.value.trim());
      else localStorage.removeItem('gw_saved_id');
    });
    $id.addEventListener('blur', () => {
      if ($saveId.checked) localStorage.setItem('gw_saved_id', $id.value.trim());
    });
  }

  $id?.addEventListener('input', () => {
    showIdError('');
    const raw = ($id.value || '');
    const norm = raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if ($id.value !== norm) $id.value = norm;
    if (norm.length === 0) {
      openPwBlock(false);
    } else {
      openPwBlock(true);
    }
  });

  $next?.addEventListener('click', async () => {
    showIdError('');
    showPwError('');
    const id = ($id?.value || '').trim().toLowerCase();
    const pw = ($pw?.value || '').trim();

    if (!id) { showIdError('아이디를 입력해주세요.'); openPwBlock(false); return; }
    if (!pw) { showPwError('비밀번호를 입력하세요.'); return; }

    try {
      const email = `${id}@example.com`;
      const { data: s, error: authErr } = await supabase.auth.signInWithPassword({ email, password: pw });

      if (authErr || !s?.user) {
        console.warn('[auth error]', authErr);
        showPwError('아이디 또는 비밀번호가 다릅니다.');
        return;
      }

      const uid = s.user.id;
      const { data: prof, error: pfErr } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', uid)
        .maybeSingle();

      if (pfErr || !prof) {
        console.warn('[profiles error]', pfErr);
        showPwError('프로필 정보를 불러올 수 없습니다.');
        await supabase.auth.signOut();
        return;
      }

      const status = String(prof.status || '').toLowerCase();
      if (status !== 'approved') {
        if (status === 'pending') showIdError('승인 대기 중입니다. 관리자 승인 후 로그인할 수 있어요.');
        else if (status === 'rejected') showIdError('반려되었습니다. 텔레그램으로 연락해주세요.');
        else if (status === 'deleted') showIdError('존재 하지 않는 아이디 입니다.');
        else showIdError('로그인을 진행할 수 없습니다. 관리자에게 문의하세요.');
        await supabase.auth.signOut();
        openPwBlock(false);
        return;
      }

      const until = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('gov24_login_until', String(until));
      location.href = '../index.html';
    } catch (e) {
      console.error('[login] signIn fatal error:', e);
      showPwError('로그인 중 오류가 발생했습니다.');
    }
  });
})();