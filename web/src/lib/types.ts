/** 책 판매처 링크 (관리자 화면에서만 노출) */
export type PurchaseLink = {
  seller: string; // 교보문고 / 알라딘 / 예스24 등
  url: string;
};

export type Book = {
  id: number;
  title: string;
  introduction: string;
  author_note: string;
  cover_path: string | null;
  book_type: string | null;
  published_year: number | null;
  is_published: boolean; // 출간 완료 여부 (false = 미출간/출간예정)
  purchase_links: PurchaseLink[]; // 판매처 링크 — 관리자 전용 노출
  sort_order: number | null; // 노출 순서(서재/관리자 공통, 작을수록 먼저)
  created_at: string;
};

export type BookSummary = Pick<Book, "id" | "title" | "cover_path" | "book_type">;

// 전체보기(그리드)용 — 요약 정보 + 소개 3줄 미리보기를 위한 introduction 포함
export type BookListItem = BookSummary & Pick<Book, "introduction">;

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  address: string | null;
  gender: "male" | "female" | "other" | "na" | null;
  bio: string | null;
  avatar_url: string | null; // 프로필 이미지 (Storage 공개 URL) — 없으면 사람 아이콘 대체
  role: "member" | "admin";
  created_at: string;
};

export type CommentNode = {
  id: number;
  book_id: number;
  parent_id: number | null;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null; // 작성자 프로필 이미지 — 없으면 사람 아이콘 대체
  content: string;
  hidden: boolean;
  created_at: string;
  edited_at: string | null;
  children: CommentNode[];
};
