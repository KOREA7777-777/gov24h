console.log('[newlogin.js] loaded');

window.__newloginLoaded = true;

async function checkLoginIdAvailable(loginId) {
  const supabase = window.supabaseClient;
  if (!supabase) return { ok: false };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('login_id', loginId)
      .maybeSingle();

    if (error) return { ok: false };
    return { ok: !data };
  } catch (e) {
    return { ok: false };
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

let idChecked = false;

// ---------------- 이름 검증 ----------------
const reKoreanName = /^[가-힣]{1,10}$/;

function setHelp(input, help, msg, error) {
  if (help) help.textContent = msg;
  if (input) {
    input.classList.toggle('is-error', error);
    input.classList.toggle('is-ok', !error);
  }
}

// ---------------- 주민번호 ----------------
function onlyDigits(str) {
  return str.replace(/\D/g, '');
}

rrn1?.addEventListener('input', () => {
  rrn1.value = onlyDigits(rrn1.value).slice(0, 6);
});
rrn2?.addEventListener('input', () => {
  rrn2.value = onlyDigits(rrn2.value).slice(0, 7);
});

// ---------------- 아이디 입력 ----------------
userId?.addEventListener('input', () => {
  idChecked = false;
  const cleaned = userId.value.replace(/[^a-z0-9]/gi, '').toLowerCase();
  userId.value = cleaned;

  if (!cleaned) {
    setHelp(userId, idHelp, '아이디를 입력해 주세요.', true);
  } else {
    setHelp(userId, idHelp, '중복 확인을 눌러주세요.', false);
  }
});

// ---------------- 중복 확인 ----------------
btnIdCheck?.addEventListener('click', async () => {
  const v = userId?.value.trim();

  if (!v) {
    setHelp(userId, idHelp, '아이디를 입력해 주세요.', true);
    return;
  }

  const { ok } = await checkLoginIdAvailable(v);

  if (!ok) {
    setHelp(userId, idHelp, '이미 사용 중인 아이디입니다.', true);
    idChecked = false;
  } else {
    setHelp(userId, idHelp, '사용 가능한 아이디입니다.', false);
    idChecked = true;
  }
});

// ---------------- 비밀번호 ----------------
const reRule = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

function checkPwRule() {
  const v = pw?.value || '';
  if (!reRule.test(v)) {
    setHelp(pw, pwRule, '영문과 숫자를 포함해 8~20자로 입력해 주세요.', true);
    return false;
  }
  setHelp(pw, pwRule, '', false);
  return true;
}

function checkPwMatch() {
  if (pw.value !== pw2.value) {
    setHelp(pw2, pwMatch, '비밀번호를 다시 확인해 주세요.', true);
    return false;
  }
  setHelp(pw2, pwMatch, '', false);
  return true;
}

// ---------------- 검증 ----------------
function validateStep1() {
  if (!reKoreanName.test(nameInput.value)) {
    setHelp(nameInput, nameHelp, '이름은 한글 1~10자로 입력해 주세요.', true);
    return false;
  }

  if (rrn1.value.length !== 6 || rrn2.value.length !== 7) {
    setHelp(rrn2, rrnHelp, '주민등록번호를 정확히 입력해 주세요.', true);
    return false;
  }

  if (!idChecked) {
    alert('아이디 중복 확인 해주세요');
    return false;
  }

  if (!checkPwRule()) return false;
  if (!checkPwMatch()) return false;

  return true;
}

// ---------------- 회원가입 ----------------
const supabase = window.supabaseClient;

async function registerToSupabase() {
  const { data, error } = await supabase.auth.signUp({
    email: `${userId.value}@test.com`,
    password: pw.value
  });

  if (error) {
    alert(error.message);
    return;
  }

  const user = data.user;

  await supabase.from('profiles').insert({
    user_id: user.id,
    login_id: userId.value,
    user_name: nameInput.value,
    status: 'pending'
  });

  alert('회원가입 완료!');
}

// ---------------- 버튼 ----------------
btnSubmit?.addEventListener('click', async () => {
  if (!validateStep1()) return;
  await registerToSupabase();
});