const SUPABASE_URL = 'https://wnkogspcwjvwulhlupml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dzDWW99uBpqo3UsFXm7A1g_F7zb7KPD';

// 🔥 이게 핵심 수정
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 등록
window.supabaseClient = client;