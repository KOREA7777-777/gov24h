const SUPABASE_URL = 'https://(supabase name here).supabase.co';
const SUPABASE_ANON_KEY = 'supabase anon key here';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 