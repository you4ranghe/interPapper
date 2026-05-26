-- 댓글 조회 시 profiles(name) 임베드가 RLS로 막혀 다른 사용자의 댓글이 보이지 않는 문제 수정.
-- 기존 'profiles select'(본인/관리자만) 정책에 추가로 누구나 SELECT 가능한 정책을 더함.
-- PostgreSQL RLS는 정책을 OR로 결합하므로, 결과적으로 모든 사용자가 profiles를 SELECT 가능.
--
-- 보안 trade-off: 누구나 profiles의 모든 컬럼(email/address/bio)을 조회할 수 있게 됨.
-- 운영 단계에서는 민감 컬럼을 별도 view로 분리하는 것을 권장. (후속 마이그레이션에서 처리)

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles select public'
  ) then
    create policy "profiles select public" on public.profiles
      for select using (true);
  end if;
end $$;
