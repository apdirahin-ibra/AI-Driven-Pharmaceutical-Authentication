create table if not exists public.scan_records (
  id text primary key,
  medicine text not null,
  image_label text not null,
  image_data_url text,
  result text not null check (result in ('Real', 'Fake', 'Suspicious')),
  model_prediction text not null check (model_prediction in ('Real', 'Fake')),
  confidence double precision not null,
  fake_score double precision not null,
  real_score double precision not null,
  model text not null,
  pharmacist text not null,
  date_time text not null,
  review_status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_reports (
  id text primary key,
  scan_id text not null references public.scan_records(id) on delete cascade,
  medicine text not null,
  image_label text not null,
  image_data_url text,
  ai_result text not null check (ai_result in ('Fake', 'Suspicious')),
  model_prediction text not null check (model_prediction in ('Real', 'Fake')),
  confidence double precision not null,
  fake_score double precision not null,
  real_score double precision not null,
  pharmacist text not null,
  scan_date text not null,
  status text not null check (status in ('Open', 'Under Review', 'Resolved')),
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists scan_records_created_at_idx
  on public.scan_records(created_at desc);

create index if not exists risk_reports_created_at_idx
  on public.risk_reports(created_at desc);

create index if not exists risk_reports_scan_id_idx
  on public.risk_reports(scan_id);
