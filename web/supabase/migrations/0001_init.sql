-- Interpaper 초기 스키마 (Supabase / Postgres)
-- profiles / books / comments + RLS + 트리거
-- Supabase 대시보드 SQL Editor 또는 supabase CLI 로 실행.

-- ========== profiles (auth.users 1:1 확장) ==========
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,                                   -- 성함(댓글 표시명)
  address     text,
  gender      text default 'na' check (gender in ('male','female','other','na')),
  bio         text,                                    -- 자기소개
  role        text not null default 'member' check (role in ('member','admin')),
  created_at  timestamptz not null default now()
);
-- 이미 profiles 가 (다른 형태로) 존재할 경우를 대비해 누락 컬럼 보강
alter table public.profiles add column if not exists email      text;
alter table public.profiles add column if not exists name       text;
alter table public.profiles add column if not exists address    text;
alter table public.profiles add column if not exists gender     text default 'na';
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists role       text not null default 'member';
alter table public.profiles add column if not exists created_at timestamptz not null default now();

-- ========== books ==========
create table if not exists public.books (
  id              bigint generated always as identity primary key,
  title           text not null,
  introduction    text not null,
  author_note     text not null default '',
  cover_path      text,                                -- Storage 공개 URL/경로
  book_type       text,                                -- 책타입(필터용)
  published_year  int,                                 -- 연도(필터용)
  created_at      timestamptz not null default now()
);

-- ========== comments (무한 계층 + 숨김) ==========
create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  book_id     bigint not null references public.books(id) on delete cascade,
  parent_id   bigint references public.comments(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_comments_book on public.comments(book_id);
create index if not exists idx_comments_parent on public.comments(parent_id);

-- ========== 헬퍼 함수 ==========
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

create or replace function public.is_email_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null);
$$;

-- ========== 신규 가입 시 profiles 자동 생성 ==========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, address, gender, bio, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'address', ''),
    coalesce(new.raw_user_meta_data->>'gender', 'na'),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    case when new.email = 'you4ranghe@gmail.com' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ========== RLS ==========
alter table public.profiles enable row level security;
alter table public.books    enable row level security;
alter table public.comments enable row level security;

-- profiles: 본인 또는 관리자
drop policy if exists "profiles select" on public.profiles;
create policy "profiles select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles update" on public.profiles;
create policy "profiles update" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

-- books: 공개 읽기, 쓰기는 관리자
drop policy if exists "books read" on public.books;
create policy "books read" on public.books for select using (true);
drop policy if exists "books admin insert" on public.books;
create policy "books admin insert" on public.books for insert with check (public.is_admin());
drop policy if exists "books admin update" on public.books;
create policy "books admin update" on public.books for update using (public.is_admin());
drop policy if exists "books admin delete" on public.books;
create policy "books admin delete" on public.books for delete using (public.is_admin());

-- comments: 숨김 아닌 글은 공개(관리자는 전체), 작성은 이메일 인증 회원만
drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments
  for select using (hidden = false or public.is_admin());
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments
  for insert with check (auth.uid() = author_id and public.is_email_verified());
drop policy if exists "comments admin update" on public.comments;
create policy "comments admin update" on public.comments
  for update using (public.is_admin());
drop policy if exists "comments delete" on public.comments;
create policy "comments delete" on public.comments
  for delete using (auth.uid() = author_id or public.is_admin());
