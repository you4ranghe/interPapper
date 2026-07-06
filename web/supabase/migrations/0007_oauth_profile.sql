-- 소셜 로그인(구글) 대응: 신규 가입 트리거를 OAuth 메타데이터까지 읽도록 보강.
-- 구글: raw_user_meta_data 에 name / full_name / avatar_url / picture
-- 이메일 가입: 기존처럼 name / address / gender / bio (직접 입력)

-- 프로필 이미지 컬럼(없으면 보강)
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, address, gender, bio, avatar_url, role)
  values (
    new.id,
    new.email,
    -- 이메일 가입은 'name', 소셜은 'name' 또는 'full_name'
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      nullif(new.raw_user_meta_data->>'full_name', ''),
      ''
    ),
    coalesce(new.raw_user_meta_data->>'address', ''),
    coalesce(new.raw_user_meta_data->>'gender', 'na'),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    -- 소셜 프로필 사진(있으면), 구글은 avatar_url/picture
    coalesce(
      nullif(new.raw_user_meta_data->>'avatar_url', ''),
      nullif(new.raw_user_meta_data->>'picture', '')
    ),
    case when new.email = 'you4ranghe@gmail.com' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 트리거 재설정(멱등)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
