const SUPABASE_URL =
  "https://pjepzszhrpsfvrudodju.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_f3oujodTx0YA9ZxKvyzNSg_uaZAy7YY";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
