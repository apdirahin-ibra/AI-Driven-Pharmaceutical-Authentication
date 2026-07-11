begin;

-- Backfill only display names that identify exactly one Auth user. Ambiguous or
-- unmatched legacy rows deliberately remain Admin-only for manual review.
with auth_names as (
  select
    lower(trim(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''))) as normalized_name,
    min(id) as user_id,
    count(*) as matches
  from auth.users
  group by lower(trim(coalesce(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '')))
), unique_auth_names as (
  select normalized_name, user_id
  from auth_names
  where normalized_name <> '' and matches = 1
)
update public.scan_records scan
set pharmacist_id = names.user_id
from unique_auth_names names
where scan.pharmacist_id is null
  and lower(trim(scan.pharmacist)) = names.normalized_name;

update public.risk_reports report
set pharmacist_id = scan.pharmacist_id
from public.scan_records scan
where report.pharmacist_id is null
  and report.scan_id = scan.id
  and scan.pharmacist_id is not null;

commit;
