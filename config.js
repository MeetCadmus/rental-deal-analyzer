// Cloud-sync configuration (optional).
//
// Leave these blank and the app runs exactly as before — 100% local, no sign-in.
// Fill them in to enable Google sign-in + cross-device sync via Supabase.
//
// Both values are from Supabase → Project Settings → API and are SAFE to commit:
// the anon key is designed to be public; Row-Level Security is what protects data.
window.SUPABASE_URL = "";       // e.g. "https://abcdefgh.supabase.co"
window.SUPABASE_ANON_KEY = "";  // the "anon public" key
