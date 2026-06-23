export type Book = {
  id: number;
  title: string;
  introduction: string;
  author_note: string;
  cover_path: string | null;
  book_type: string | null;
  published_year: number | null;
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
  role: "member" | "admin";
  created_at: string;
};

export type CommentNode = {
  id: number;
  book_id: number;
  parent_id: number | null;
  author_id: string;
  author_name: string;
  content: string;
  hidden: boolean;
  created_at: string;
  edited_at: string | null;
  children: CommentNode[];
};
