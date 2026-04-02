import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://wnkogspcwjvwulhlupml.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dzDWW99uBpqo3UsFXm7A1g_F7zb7KPD';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.supabaseClient = supabase;