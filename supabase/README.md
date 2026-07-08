# Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `backend/.env.example` to `backend/.env`.
4. Set:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

Keep `SUPABASE_SERVICE_ROLE_KEY` only in the backend environment. Do not expose it in the React frontend.

5. Copy `frontend/.env.example` to `frontend/.env` and set:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

6. In Supabase, create at least one login user:

- Go to Authentication > Users.
- Click Add user.
- Enter the pharmacist or admin email and password.
- Use that email/password on the PharmaGuard login page.

7. Promote the first admin user once from the Supabase SQL editor:

```sql
update auth.users
set
  raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"Admin"}'::jsonb,
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"Admin","full_name":"System Admin"}'::jsonb
where email = 'your-admin-email@example.com';
```

After this, log out and log back in. Admin users can create more Admin and Pharmacist accounts from `User Management`.

The app now stores scan history and risk reports through FastAPI endpoints backed by Supabase:

- `GET /scans`
- `POST /scans`
- `GET /reports`
- `PATCH /reports/{report_id}`

These database endpoints require a valid Supabase Auth access token from the frontend.
