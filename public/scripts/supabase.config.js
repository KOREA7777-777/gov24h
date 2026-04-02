const SUPABASE_URL = 'https://wnkogspcwjvwulhlupml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dzDWW99uBpqo3UsFXm7A1g_F7zb7KPD';

window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 