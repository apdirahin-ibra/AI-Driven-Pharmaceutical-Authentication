begin;

update public.scan_records
set model = 'CNN'
where model = 'Improved CNN';

commit;
