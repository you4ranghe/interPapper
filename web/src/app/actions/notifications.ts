"use server";

import { createClient } from "@/lib/supabase/server";
import { fetchUnreadForAdmin, type UnreadComment } from "@/lib/notifications";

async function getAdminUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") return null;
  return user.id;
}

export type UnreadSnapshot = { count: number; items: UnreadComment[] };

/** 미읽음 댓글 + 카운트 (관리자만, 비관리자는 0). */
export async function getUnreadSnapshot(): Promise<UnreadSnapshot> {
  const items = await fetchUnreadForAdmin(50);
  return { count: items.length, items };
}

/** 단일 댓글 읽음 처리. */
export async function markCommentRead(commentId: number): Promise<{ ok: boolean }> {
  const userId = await getAdminUserId();
  if (!userId) return { ok: false };
  const supabase = await createClient();
  await supabase.from("comment_reads").upsert(
    { user_id: userId, comment_id: commentId },
    { onConflict: "user_id,comment_id", ignoreDuplicates: true }
  );
  return { ok: true };
}

/** 여러 댓글 읽음 처리. */
export async function markCommentsRead(commentIds: number[]): Promise<{ ok: boolean }> {
  if (commentIds.length === 0) return { ok: true };
  const userId = await getAdminUserId();
  if (!userId) return { ok: false };
  const supabase = await createClient();
  const rows = commentIds.map((id) => ({ user_id: userId, comment_id: id }));
  await supabase.from("comment_reads").upsert(rows, {
    onConflict: "user_id,comment_id",
    ignoreDuplicates: true,
  });
  return { ok: true };
}
