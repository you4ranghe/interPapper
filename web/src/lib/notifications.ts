// 관리자 댓글 알림: 미읽음 댓글 조회 / 읽음 표시.
// 미읽음 = (관리자 자신이 작성하지 않은 댓글) ∧ (comment_reads에 본인 기록 없음)

import { createClient as createServerClient } from "@/lib/supabase/server";

export type UnreadComment = {
  id: number;
  book_id: number;
  parent_id: number | null;
  content: string;
  hidden: boolean;
  created_at: string;
  author_name: string;
  book_title: string;
};

type RawRow = {
  id: number;
  book_id: number;
  parent_id: number | null;
  content: string;
  hidden: boolean;
  created_at: string;
  author_id: string;
  profiles: { name: string | null } | null;
  books: { title: string | null } | null;
};

/**
 * 관리자에게 보여줄 미읽음 댓글 목록(최신순). 비관리자는 빈 배열.
 * RLS로 comment_reads는 본인 것만 보이므로 join 대신 두 번 쿼리 후 차집합.
 */
export async function fetchUnreadForAdmin(limit = 50): Promise<UnreadComment[]> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") return [];

  const { data: readRows } = await supabase
    .from("comment_reads").select("comment_id").eq("user_id", user.id);
  const readSet = new Set(((readRows as { comment_id: number }[]) ?? []).map((r) => r.comment_id));

  const { data } = await supabase
    .from("comments")
    .select("id,book_id,parent_id,content,hidden,created_at,author_id, profiles!comments_author_id_fkey(name), books(title)")
    .neq("author_id", user.id)
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(Math.max(limit, 200));

  const rows = (data as unknown as RawRow[]) ?? [];
  const unread = rows.filter((r) => !readSet.has(r.id)).slice(0, limit);
  return unread.map((r) => ({
    id: r.id,
    book_id: r.book_id,
    parent_id: r.parent_id,
    content: r.content,
    hidden: r.hidden,
    created_at: r.created_at,
    author_name: r.profiles?.name || "익명",
    book_title: r.books?.title || "",
  }));
}
