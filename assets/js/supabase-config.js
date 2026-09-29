// Add Supabase URL and public anon key here when connecting the backend. Never expose a service-role key.
const SUPABASE_URL = "https://pjepzszhrpsfvrudodju.supabase.co";
const SUPABASE_KEY = "sb_publishable_f3oujodTx0YA9ZxKvyzNSg_uaZAy7YY";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
