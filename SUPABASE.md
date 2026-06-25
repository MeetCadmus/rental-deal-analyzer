# Cloud sync setup (Supabase + Google)

Optional. Without it the app is 100% local (deals live in your browser).
With it, you sign in with Google and your deals sync across devices.

## 1. Create the project

Create a free project at <https://supabase.com> → **New project**. Note the
**project ref** (the subdomain of your project URL, e.g. `abcdefgh`).

## 2. Apply the database migration

The schema lives in version control under `supabase/migrations/`. Apply it with
the Supabase CLI (Liquibase-style):

```bash
brew install supabase/tap/supabase   # if you don't have the CLI
supabase login                        # opens a browser; token stays on your machine
supabase link --project-ref <your-project-ref>
supabase db push                      # applies supabase/migrations/*.sql
```

(Or, if you prefer no CLI: open Supabase → **SQL Editor**, paste the contents of
`supabase/migrations/20260619090000_user_data.sql`, and **Run**.)

## 3. Enable Google sign-in

Supabase dashboard → **Authentication → Providers → Google → Enable**.
It shows a **redirect URI** like `https://<ref>.supabase.co/auth/v1/callback` —
create a Google OAuth **Web** client (Google Cloud Console → Credentials), set
that as the Authorized redirect URI, and paste the Client ID/Secret back into
Supabase.

## 4. Allow the app's URL

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://meetcadmus.github.io/rental-deal-analyzer/`
- **Redirect URLs:** add the same URL (and `http://localhost:8000` for local testing).

## 5. Add the public keys to the app

From **Project Settings → API**, copy the **Project URL** and the **anon public**
key into `config.js`:

```js
window.SUPABASE_URL = "https://<ref>.supabase.co";
window.SUPABASE_ANON_KEY = "<anon public key>";
```

Commit it — both are safe to expose (RLS protects the data). Reload the app and a
**Sign in with Google** button appears in the header.

## How sync works

- On sign-in, your cloud library is merged with whatever is local — **per deal,
  newest edit wins** (by each deal's `_ts`), and the two sets are unioned so
  neither device clobbers the other's new deals.
- Every change is then saved back to the cloud (debounced).
- localStorage stays as the offline cache, and **Export all** (JSON) remains a
  manual backup.
- Note: this v1 does not propagate **deletions** across devices (a deal deleted on
  one device can return from another). Tombstone-based delete sync can be added later.
