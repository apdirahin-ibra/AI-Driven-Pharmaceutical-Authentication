begin;

-- Normalize only recognized legacy values. Unknown values remain untouched so
-- they can be reviewed instead of being silently promoted.
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role',
  case
    when lower(coalesce(raw_app_meta_data->>'role', raw_user_meta_data->>'role', '')) = 'admin' then 'Admin'
    when lower(coalesce(raw_app_meta_data->>'role', raw_user_meta_data->>'role', '')) in ('pharmacist', 'pharmacy', 'pharmacies') then 'Pharmacist'
    else coalesce(raw_app_meta_data->>'role', raw_user_meta_data->>'role')
  end
)
where lower(coalesce(raw_app_meta_data->>'role', raw_user_meta_data->>'role', ''))
  in ('admin', 'pharmacist', 'pharmacy', 'pharmacies');

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
  'role', raw_app_meta_data->>'role'
)
where raw_app_meta_data->>'role' in ('Admin', 'Pharmacist');

alter table public.scan_records
  add column if not exists pharmacist_id uuid references auth.users(id) on delete set null,
  add column if not exists image_bucket text,
  add column if not exists image_path text;

alter table public.risk_reports
  add column if not exists pharmacist_id uuid references auth.users(id) on delete set null,
  add column if not exists image_bucket text,
  add column if not exists image_path text;

update public.risk_reports report
set pharmacist_id = scan.pharmacist_id,
    image_bucket = coalesce(report.image_bucket, scan.image_bucket),
    image_path = coalesce(report.image_path, scan.image_path)
from public.scan_records scan
where report.scan_id = scan.id;

create index if not exists scan_records_pharmacist_id_idx
  on public.scan_records(pharmacist_id, created_at desc);
create index if not exists risk_reports_pharmacist_id_idx
  on public.risk_reports(pharmacist_id, created_at desc);

-- Browser clients do not access these tables or scan images directly. The
-- trusted FastAPI backend uses the service role and enforces Admin/Pharmacist
-- ownership before every read or mutation.
alter table public.scan_records enable row level security;
alter table public.risk_reports enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medicine-scans',
  'medicine-scans',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

commit;
