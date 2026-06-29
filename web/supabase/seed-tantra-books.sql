-- 탄트라 총서 16권 일괄 등록 (저자: 김은재 / 출판사: 지혜의나무)
-- 출처: docs/tantra_books_list.pdf
--
-- 주의: 기존 books(및 연결된 comments)를 모두 삭제하고 새로 등록합니다.
--   · truncate ... restart identity cascade → id 1부터 재시작 + comments 동반 삭제
--   · introduction/author_note 는 빈 값으로 등록 후 관리자에서 채웁니다(표지 포함).
--   · purchase_links 는 관리자 화면에서만 노출됩니다.
-- 실행: Supabase SQL Editor (postgres/서비스 롤 → RLS 무시).
--   * 먼저 migrations/0005_book_purchase_links.sql 적용 후 실행할 것.

truncate table public.books restart identity cascade;

insert into public.books
  (title, introduction, author_note, book_type, published_year, is_published, sort_order, purchase_links)
values
  -- (1) 출간 완료 도서 1~11번
  ('가시를 빼기 위한 가시 『비갸나 바이라바』', '', '', null, null, true, 1,
   '[{"seller":"교보문고","url":"https://product.kyobobook.co.kr/detail/S000001417200"}]'::jsonb),

  ('수행경(修行經) 『쉬바 수트라』', '', '', null, null, true, 2,
   '[{"seller":"알라딘","url":"https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=45198061"}]'::jsonb),

  ('스판다와 재인식(再認識)의 『소와 참나 이야기』', '', '', null, null, true, 3,
   '[{"seller":"알라딘","url":"https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=88293217"}]'::jsonb),

  ('아는 자를 아는 일 『프라탸비갸 흐리다얌』', '', '', null, null, true, 4,
   '[{"seller":"예스24","url":"https://www.yes24.com/product/goods/37237925"}]'::jsonb),

  ('참 나를 느끼는 『스판다 카리카』', '', '', null, null, true, 5,
   '[{"seller":"예스24","url":"https://www.yes24.com/product/goods/43976092"}]'::jsonb),

  ('삼위일체경(三位一體經) 『파라 트리쉬카』', '', '', null, null, true, 6,
   '[{"seller":"예스24","url":"https://www.yes24.com/product/goods/86019168"}]'::jsonb),

  ('전체성(全體性)과 크라마의 『뱀과 얼나 이야기』', '', '', null, null, true, 7,
   '[{"seller":"예스24","url":"https://www.yes24.com/product/goods/103837882"}]'::jsonb),

  ('탄트라 알로카의 정수(精髓) 『탄트라 사라』', '', '', null, null, true, 8,
   '[{"seller":"교보문고","url":"https://product.kyobobook.co.kr/detail/S000001862025"}]'::jsonb),

  ('아비나바 바라티의 『숭고미의 미학(美學)』', '', '', null, null, true, 9,
   '[{"seller":"교보문고","url":"https://product.kyobobook.co.kr/detail/S000208579731"}]'::jsonb),

  ('문학, 영화 그리고 꿈의 『거울 속에서』', '', '', null, null, true, 10,
   '[{"seller":"교보문고","url":"https://product.kyobobook.co.kr/detail/S000214078329"},{"seller":"예스24","url":"https://www.yes24.com/product/goods/132201529"}]'::jsonb),

  ('<신(神)-인식(認識)>경(經) 『이슈와라-프라탸비갸』', '', '', null, null, true, 11,
   '[{"seller":"알라딘","url":"https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=370130633"}]'::jsonb),

  -- (2) 출간 예정 도서 12~16번 (미출간)
  ('인간(우주)의 본질을 꿰뚫는 『말리니-비자야 탄트라』', '', '', null, null, false, 12, '[]'::jsonb),
  ('한 돌이 들려주는 『돌과 즈슴 이야기』',            '', '', null, null, false, 13, '[]'::jsonb),
  ('웃팔라데바의 『하나님 증명과 찬양』',              '', '', null, null, false, 14, '[]'::jsonb),
  ('웃팔라데바와 아비나바굽타의 『참맛을 찾아』',       '', '', null, null, false, 15, '[]'::jsonb),
  ('죽음을 극복(克服)하는 『네트라 탄트라 수행』',      '', '', null, null, false, 16, '[]'::jsonb);
