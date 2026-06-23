-- 댓글/답글 본인 수정 + 편집일시 표기
-- edited_at: 수정된 적이 있으면 마지막 수정 시각(없으면 NULL = 미편집)

alter table public.comments add column if not exists edited_at timestamptz;

-- 본인 댓글만, content/edited_at 만 변경하는 안전한 함수.
-- (RLS update 정책을 넓게 열지 않고, 이 함수로만 수정 → hidden 등 다른 컬럼 우회 불가)
create or replace function public.edit_own_comment(p_id bigint, p_content text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(btrim(p_content), '') = '' then
    raise exception '내용이 비어 있습니다.';
  end if;
  update public.comments
     set content = p_content,
         edited_at = now()
   where id = p_id
     and author_id = auth.uid()
     and hidden = false;
  if not found then
    raise exception '수정 권한이 없거나 대상이 없습니다.';
  end if;
end;
$$;

grant execute on function public.edit_own_comment(bigint, text) to authenticated;
