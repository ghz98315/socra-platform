-- Read-only diagnostic SQL for the current Supabase project.
-- Use this in the Supabase SQL Editor when new-user creation still fails
-- after applying 20260402_add_profiles_email_compat.sql.

-- 1. auth.users triggers
select
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal
order by t.tgname;

-- 2. auth.users trigger function bodies
select
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_def
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.oid in (
  select t.tgfoid
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n2 on n2.oid = c.relnamespace
  where n2.nspname = 'auth'
    and c.relname = 'users'
    and not t.tgisinternal
)
  and p.prokind = 'f'
order by p.proname;

-- 3. Any function body that still references profiles.email or profile writes
select
  n.nspname as schema_name,
  p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.prokind = 'f'
  and (
    pg_get_functiondef(p.oid) ilike '%profiles.email%'
    or pg_get_functiondef(p.oid) ilike '%insert into profiles%'
    or pg_get_functiondef(p.oid) ilike '%update profiles%'
  )
order by n.nspname, p.proname;

-- 4. Live column shape checks
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'socra_points', 'invite_codes', 'user_levels', 'community_profiles')
order by table_name, ordinal_position;

-- 5. Object row counts
select 'auth.users' as object_name, count(*)::bigint as row_count from auth.users
union all
select 'profiles', count(*)::bigint from public.profiles
union all
select 'user_levels', count(*)::bigint from public.user_levels
union all
select 'socra_points', count(*)::bigint from public.socra_points
union all
select 'invite_codes', count(*)::bigint from public.invite_codes
union all
select 'community_profiles', count(*)::bigint from public.community_profiles
order by object_name;
