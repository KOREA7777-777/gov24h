console.log('[newlogin.js] loaded');

window.__newloginLoaded = true;

async function checkLoginIdAvailable(loginId) {
  const supabase = window.supabaseClient;
  if (!supabase) return { ok: false, reason: 'no-client' };
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('login_id', loginId)
      .maybeSingle();
    if (error) {
      console.warn('[ID Check] profiles lookup error:', error);
      return { ok: false, reason: 'lookup-error' };
    }
    return { ok: !data };
  } catch (e) {
    console.warn('[ID Check] exception:', e);
    return { ok: false, reason: 'exception' };
  }
}

const $ = (sel) => document.querySelector(sel);
const nameInput = $('#name');
const nameHelp = $('#nameHelp');
const rrn1 = $('#rrn1');
const rrn2 = $('#rrn2');
const rrnHelp = $('#rrnHelp');
const userId = $('#userId');
const idHelp = $('#idHelp');
const pw = $('#password');
const pwRule = $('#pwRule');
const pw2 = $('#password2');
const pwMatch = $('#pwMatch');
const btnIdCheck = $('#btnIdCheck');
const btnSubmit = $('#btnSubmit');
const btnCancel = $('#btnCancel');

const step1Card = document.querySelector('.nl-card');
const step2Card = document.getElementById('step2Card');
const step1Actions = document.getElementById('step1Actions');
const step2Actions = document.getElementById('step2Actions');
const btnNextStep = document.getElementById('btnNextStep');
const btnBackStep1 = document.getElementById('btnBackStep1');

const addr1Input = $('#addr1');
const addr2Input = $('#addr2');
const addr3Input = $('#addr3');
const issueDateInput = $('#issueDate');
const issuerInput = $('#issuer');

if (nameInput) nameInput.setAttribute('maxlength', '10');

btnCancel?.addEventListener('click', () => {

  window.location.href = 'beforelogin.html';
});

function setNeutral(inputEl, helpEl, msg) {
  if (helpEl && typeof msg === 'string') helpEl.textContent = msg;
  helpEl?.classList.remove('error', 'ok');
  inputEl?.classList.remove('is-error', 'is-ok');
}
function setHelp(inputEl, helpEl, msg, isError) {
  if (helpEl) {
    helpEl.textContent = msg || '';
    helpEl.classList.toggle('error', !!isError);
    helpEl.classList.toggle('ok', !isError);
  }
  if (inputEl) {
    inputEl.classList.toggle('is-error', !!isError);
    inputEl.classList.toggle('is-ok', !isError);
  }
}
function hideHelp(helpEl) { if (helpEl) helpEl.textContent = ''; helpEl?.classList.remove('error', 'ok'); }
function onlyDigits(str) { return str.replace(/\D+/g, ''); }

function goStep2() {
  if (step1Card) step1Card.classList.add('is-hidden');
  if (step2Card) step2Card.classList.remove('is-hidden');
  if (step1Actions) step1Actions.classList.add('is-hidden');
  if (step2Actions) step2Actions.classList.remove('is-hidden');
}

function goStep1() {
  if (step1Card) step1Card.classList.remove('is-hidden');
  if (step2Card) step2Card.classList.add('is-hidden');
  if (step1Actions) step1Actions.classList.remove('is-hidden');
  if (step2Actions) step2Actions.classList.add('is-hidden');
}

const reKoreanName = /^[가-힣]{1,10}$/;
function sanitizeKorean(str) {
  return String(str || '').replace(/[^가-힣]/g, '').slice(0, 10);
}

const reRule = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':",.<>/?`~]{8,20}$/;

const TAKEN_IDS = new Set(['admin', 'test', 'guest', 'gov24', 'manager']);
let idChecked = false;

function isUserIdTaken(loweredId) {
  return TAKEN_IDS.has(loweredId);
}

function validateStep1() {
  const nameVal = nameInput?.value.trim() || '';
  if (!reKoreanName.test(nameVal)) {
    setHelp(nameInput, nameHelp, '이름은 한글 1~10자로 입력해 주세요.', true);
    nameInput?.focus(); return false;
  }
  if (!(rrn1?.value.length === 6 && rrn2?.value.length === 7)) {
    setHelp(rrn2, rrnHelp, '앞 6자리와 뒤 7자리를 모두 입력해 주세요.', true);
    (rrn1?.value.length === 6 ? rrn2 : rrn1)?.focus();
    return false;
  }
  if (!userId?.value.trim()) {
    setHelp(userId, idHelp, '아이디를 입력해 주세요.', true); userId?.focus(); return false;
  }
  if (!idChecked) {
    setHelp(userId, idHelp, '중복 확인을 진행해 주세요.', true);
    try { alert('아이디 중복확인을 진행해 주세요.'); } catch (e) { }
    userId?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    btnIdCheck?.focus();
    return false;
  }
  const currentId = (userId?.value || '').trim().toLowerCase();
  if (isUserIdTaken(currentId)) {
    setHelp(userId, idHelp, '이미 사용 중인 아이디입니다. 다른 아이디를 사용해 주세요.', true);
    try { alert('이미 사용 중인 아이디입니다. 다른 아이디를 사용해 주세요.'); } catch (e) { }
    userId?.focus();
    return false;
  }
  const lowered = (userId?.value || '').trim().toLowerCase();
  if (isUserIdTaken(lowered)) {
    setHelp(userId, idHelp, '이미 사용 중인 아이디입니다. 다른 아이디를 사용해 주세요.', true);
    try { alert('이미 사용 중인 아이디입니다. 다른 아이디를 사용해 주세요.'); } catch (e) { }
    userId?.focus();
    return false;
  }
  const ruleOK = checkPwRule();
  const matchOK = checkPwMatch();
  if (!ruleOK) {
    pw?.focus();
    return false;
  }
  if (!matchOK) {
    try { alert('비밀번호를 다시 한 번 확인해 주세요.'); } catch (e) { }
    pw2?.focus();
    return false;
  }
  return true;
}

let __nameComposing = false;
function updateNameHelp() {
  const v = (nameInput?.value || '').trim();
  if (v === '') setNeutral(nameInput, nameHelp, '이름을 입력해 주세요. (한글 1~10자)');
  else hideHelp(nameHelp);
}
function normalizeNameNow() {
  if (!nameInput) return;
  const orig = nameInput.value;
  const cleaned = sanitizeKorean(orig);
  if (orig !== cleaned) nameInput.value = cleaned;
  updateNameHelp();
}
nameInput?.addEventListener('compositionstart', () => { __nameComposing = true; });
nameInput?.addEventListener('compositionend', () => {
  __nameComposing = false;
  requestAnimationFrame(normalizeNameNow);
});
nameInput?.addEventListener('input', (e) => {
  if (__nameComposing || (e && e.isComposing)) return;
  updateNameHelp();
});
nameInput?.addEventListener('blur', normalizeNameNow);

function handleRRNInput() {
  if (rrn1) rrn1.value = onlyDigits(rrn1.value).slice(0, 6);
  if (rrn2) rrn2.value = onlyDigits(rrn2.value).slice(0, 7);

  const ok = (rrn1?.value.length === 6) && (rrn2?.value.length === 7);
  if (!rrn1?.value && !rrn2?.value) {
    setNeutral(rrn2, rrnHelp, '주민등록번호 앞자리와 뒷자리를 입력해 주세요.');
  } else if (ok) {
    hideHelp(rrnHelp);
  } else {
    setNeutral(rrn2, rrnHelp, '앞 6자리와 뒤 7자리를 모두 입력해 주세요.');
  }
}
rrn1?.addEventListener('input', handleRRNInput);
rrn2?.addEventListener('input', handleRRNInput);

userId?.addEventListener('input', () => {
  if (!userId) return;
  const orig = userId.value;
  const cleaned = orig.replace(/[^A-Za-z0-9]/g, '').toLowerCase();
  if (orig !== cleaned) userId.value = cleaned;
}, { capture: true });

userId?.addEventListener('input', () => {
  idChecked = false;
  const v = userId.value.trim();
  if (v === '') setNeutral(userId, idHelp, '아이디를 입력해 주세요.');
  else setNeutral(userId, idHelp, '중복 확인을 눌러 확인해 주세요.');
});

btnIdCheck?.addEventListener('click', () => {
  const v = userId?.value.trim();
  if (!v) { setHelp(userId, idHelp, '아이디를 입력해 주세요.', true); return; }
  if (!/^[a-z0-9]{4,20}$/i.test(v)) {
    setHelp(userId, idHelp, '영문과 숫자 4~20자로 입력해 주세요.', true);
    idChecked = false;
    return;
  }

  (async () => {
    const lowered = v.toLowerCase();
    const { ok } = await checkLoginIdAvailable(lowered);
    if (!ok) {
      setHelp(userId, idHelp, '이미 사용 중인 아이디입니다.', true);
      idChecked = false;
    } else {
      setHelp(userId, idHelp, '사용 가능한 아이디입니다.', false);
      idChecked = true;
    }
  })();
});

function checkPwRule() {
  const v = pw?.value || '';
  if (!v) {
    setNeutral(pw, pwRule, '영문과 숫자를 포함해 8~20자로 입력해 주세요.');
    return false;
  }
  const ok = reRule.test(v);
  if (ok) { hideHelp(pwRule); pw?.classList.add('is-ok'); pw?.classList.remove('is-error'); }
  else { setHelp(pw, pwRule, '영문과 숫자를 포함해 8~20자로 입력해 주세요.', true); }
  return ok;
}

function checkPwMatch() {
  const v1 = pw?.value || '';
  const v2 = pw2?.value || '';
  if (!v2) {
    setNeutral(pw2, pwMatch, '비밀번호가 일치해야 합니다.');
    return false;
  }
  if (v1 === v2) {
    hideHelp(pwMatch);
    pw2?.classList.add('is-ok'); pw2?.classList.remove('is-error');
    return true;
  } else {
    setHelp(pw2, pwMatch, '비밀번호를 다시 한 번 확인해 주세요.', true);
    return false;
  }
}

pw?.addEventListener('input', () => { checkPwRule(); checkPwMatch(); });
pw2?.addEventListener('input', () => { checkPwMatch(); });

btnNextStep?.addEventListener('click', (e) => {
  e.preventDefault();
  if (validateStep1()) {
    goStep2();
  }
});

btnBackStep1?.addEventListener('click', (e) => {
  e.preventDefault();
  goStep1();
});

const supabase = window.supabaseClient;
if (!supabase) console.error('[newlogin.js] Supabase client not found. Did you include supabase.config.js first?');

async function registerToSupabase({ userId, name, password, rrnFront, rrnBack, addr1, addr2, addr3, issueDate, issuer }) {
  try {
    const { data, error: signErr } = await supabase.auth.signUp({
      email: `${userId}@example.com`,
      password,
      options: { data: { name } }
    });

    if (signErr) {
      console.error('[registerToSupabase] signUp error detail:', signErr);
      alert(`회원가입 오류: ${signErr.message || signErr.code || '알 수 없는 오류'}`);
      alert(`회원가입 오류: ${signErr.message}`);
      return;
    }
    const user = data.user;

    // 2) 프로필 저장
    const { error: profErr } = await supabase.from('profiles').insert({
      user_id: user.id,
      login_id: userId,
      user_name: name,
      addr1: addr1 || null,
      addr2: addr2 || null,
      addr3: addr3 || null,
      issue_date: issueDate || null,
      issuer: issuer || null,
      status: 'pending'
    });
    if (profErr) console.warn('profiles insert error:', profErr);
    const { error: rrnErr } = await supabase.from('sensitive_rrn').insert({
      user_id: user.id,
      rrn_front: rrnFront,
      rrn_back: rrnBack
    });
    if (rrnErr) console.warn('rrn insert error:', rrnErr);

    alert('회원가입 완료! 관리자 승인 후 로그인 가능합니다.');
    location.href = './beforelogin.html';
  } catch (err) {
    console.error('[registerToSupabase] error:', err);
    alert('서버 오류가 발생했습니다.');
  }
}
btnSubmit?.addEventListener('click', async (e) => {
  e.preventDefault();

  if (!validateStep1()) {
    goStep1();
    return;
  }

  const addr1Val = addr1Input?.value.trim() || '';
  const addr2Val = addr2Input?.value.trim() || '';
  const addr3Val = addr3Input?.value.trim() || '';
  const issueDateVal = issueDateInput?.value.trim() || '';
  const issuerVal = issuerInput?.value.trim() || '';

  if (!addr1Val) {
    alert('주소 1을 입력해 주세요.');
    addr1Input?.focus();
    return;
  }
  if (!issueDateVal) {
    alert('발급일자를 입력해 주세요.');
    issueDateInput?.focus();
    return;
  }
  if (!issuerVal) {
    alert('발급기관을 입력해 주세요.');
    issuerInput?.focus();
    return;
  }

  try {
    await registerToSupabase({
      userId: (userId?.value || '').trim(),
      name: (nameInput?.value || '').trim(),
      password: (pw?.value || ''),
      rrnFront: (rrn1?.value || ''),
      rrnBack: (rrn2?.value || ''),
      addr1: addr1Val,
      addr2: addr2Val,
      addr3: addr3Val,
      issueDate: issueDateVal,
      issuer: issuerVal
    });
  } catch (e) { /* no-op */ }
});

setNeutral(nameInput, nameHelp, '이름을 입력해 주세요. (한글 1~10자)');
setNeutral(userId, idHelp, '아이디를 입력해 주세요.');
setNeutral(pw, pwRule, '영문과 숫자를 포함해 8~20자로 입력해 주세요.');
setNeutral(pw2, pwMatch, '비밀번호가 일치해야 합니다.');