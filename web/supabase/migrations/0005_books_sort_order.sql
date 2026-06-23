-- 책 노출 순서(서재/관리자 공통) — 드래그앤드롭 정렬용
-- /library 와 /admin/books 가 동일하게 sort_order ASC 로 정렬한다.

alter table public.books add column if not exists sort_order int;

-- 기존 책들: 현재 노출 순서(created_at DESC, 최신순)를 그대로 0,1,2... 로 고정.
with ordered as (
  select id, (row_number() over (order by created_at desc) - 1) as rn
  from public.books
)
update public.books b
   set sort_order = o.rn
  from ordered o
 where o.id = b.id
   and b.sort_order is null;

create index if not exists idx_books_sort_order on public.books (sort_order);
