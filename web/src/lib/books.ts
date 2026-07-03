// 서재(공개) 책 목록 — 세션과 무관한 공개 데이터라 서버 캐시에 태그로 저장.
// 관리자 액션(등록/수정/숨김/순서변경)에서 revalidateTag(BOOKS_TAG)로 즉시 무효화한다.
import { unstable_cache } from "next/cache";
import { createClient as createSbClient } from "@supabase/supabase-js";
import type { BookListItem } from "./types";

export const BOOKS_TAG = "books";

export const getPublishedBooks = unstable_cache(
  async (): Promise<BookListItem[]> => {
    // 쿠키(세션) 없이 anon key 로만 조회 — 캐시 함수 안에서는 request API 사용 불가.
    const supabase = createSbClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    const { data, error } = await supabase
      .from("books")
      .select("id,title,cover_path,book_type,introduction")
      .eq("is_published", true) // 미출간(숨김) 책은 서재에 노출하지 않음
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data as BookListItem[]) ?? [];
  },
  ["published-books"],
  { tags: [BOOKS_TAG], revalidate: 3600 }
);
