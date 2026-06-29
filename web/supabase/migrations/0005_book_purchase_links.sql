-- 책 판매처 링크(JSONB) + 출간 여부 플래그 추가
-- purchase_links: [{ "seller": "교보문고", "url": "https://..." }, ...]
--   · 관리자 화면에서만 노출/편집 (공개 상세페이지에는 표시하지 않음)
-- is_published: 출간 완료 여부 (false = 미출간/출간예정)

alter table public.books
  add column if not exists purchase_links jsonb   not null default '[]'::jsonb;

alter table public.books
  add column if not exists is_published   boolean  not null default true;

-- 노출 순서(서재/관리자 공통, 작을수록 먼저) — 누락 시 보강
alter table public.books
  add column if not exists sort_order     int;
