-- 댓글 읽음 추적 (관리자 알림용)
-- 미읽음 = (관리자가 작성하지 않은 댓글) ∧ (comment_reads에 본인 기록 없음)
-- 재실행 안전(idempotent). drop 구문이 없으므로 Supabase 'destructive' 경고가 뜨지 않음.

create table if not exists public.comment_reads (
  user_id    uuid    not null references public.profiles(id) on delete cascade,
  comment_id bigint  not null references public.comments(id) on delete cascade,
  read_at    timestamptz not null default now(),
  primary key (user_id, comment_id)
);

create index if not exists idx_comment_reads_user on public.comment_reads(user_id);

alter table public.comment_reads enable row level security;

-- 정책은 IF NOT EXISTS 가 없어 DO 블록으로 가드.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_reads' and policyname = 'comment_reads select self'
  ) then
    create policy "comment_reads select self" on public.comment_reads
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_reads' and policyname = 'comment_reads insert self'
  ) then
    create policy "comment_reads insert self" on public.comment_reads
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comment_reads' and policyname = 'comment_reads delete self'
  ) then
    create policy "comment_reads delete self" on public.comment_reads
      for delete using (auth.uid() = user_id);
  end if;
end $$;
