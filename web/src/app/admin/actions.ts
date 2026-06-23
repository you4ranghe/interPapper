"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSbClient, type SupabaseClient } from "@supabase/supabase-js";

export type ActionState = { error?: string };

async function requireAdmin(): Promise<SupabaseClient> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "admin") {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return supabase;
}

async function uploadCover(supabase: SupabaseClient, file: File): Promise<string> {
  const dot = file.name.lastIndexOf(".");
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const buf = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from("covers")
    .upload(path, buf, { contentType: file.type || "image/png", upsert: false });
  if (error) throw new Error("표지 업로드 실패: " + error.message);
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

function parseYear(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export async function createBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let supabase: SupabaseClient;
  try {
    supabase = await requireAdmin();
    const title = String(formData.get("title") ?? "").trim();
    const introduction = String(formData.get("introduction") ?? "").trim();
    const author_note = String(formData.get("author_note") ?? "").trim();
    const book_type = String(formData.get("book_type") ?? "").trim() || null;
    const published_year = parseYear(formData.get("published_year"));
    const cover = formData.get("cover") as File | null;
    if (!title || !introduction) return { error: "제목과 소개는 필수입니다." };

    let cover_path: string | null = null;
    if (cover && cover.size > 0) cover_path = await uploadCover(supabase, cover);

    // 새 책은 노출 순서 맨 뒤로 (관리자가 드래그로 옮길 수 있음)
    const { data: last } = await supabase
      .from("books")
      .select("sort_order")
      .order("sort_order", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();
    const sort_order = (((last as { sort_order: number | null } | null)?.sort_order) ?? -1) + 1;

    const { error } = await supabase.from("books").insert({
      title, introduction, author_note, book_type, published_year, cover_path, sort_order,
    });
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "오류가 발생했습니다." };
  }
  revalidatePath("/admin/books");
  revalidatePath("/");
  redirect("/admin/books");
}

export async function updateBook(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let supabase: SupabaseClient;
  try {
    supabase = await requireAdmin();
    const id = Number(formData.get("id"));
    const title = String(formData.get("title") ?? "").trim();
    const introduction = String(formData.get("introduction") ?? "").trim();
    const author_note = String(formData.get("author_note") ?? "").trim();
    const book_type = String(formData.get("book_type") ?? "").trim() || null;
    const published_year = parseYear(formData.get("published_year"));
    const cover = formData.get("cover") as File | null;
    if (!Number.isFinite(id)) return { error: "잘못된 책입니다." };
    if (!title || !introduction) return { error: "제목과 소개는 필수입니다." };

    const patch: Record<string, unknown> = { title, introduction, author_note, book_type, published_year };
    if (cover && cover.size > 0) patch.cover_path = await uploadCover(supabase, cover);

    const { error } = await supabase.from("books").update(patch).eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "오류가 발생했습니다." };
  }
  revalidatePath("/admin/books");
  revalidatePath("/");
  redirect("/admin/books");
}

export async function deleteBook(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  if (Number.isFinite(id)) {
    await supabase.from("books").delete().eq("id", id);
    revalidatePath("/admin/books");
    revalidatePath("/");
  }
  redirect("/admin/books");
}

/**
 * 책 노출 순서 일괄 변경 (드래그앤드롭).
 * orderedIds: 화면에 보이는 순서대로의 책 id 배열.
 * startIndex: 현재 페이지의 시작 절대 위치(=페이지 offset). 페이지별로 sort_order 가 어긋나지 않게 보정.
 */
export async function reorderBooks(
  orderedIds: number[],
  startIndex: number = 0
): Promise<ActionState> {
  try {
    const supabase = await requireAdmin();
    const ids = orderedIds.filter((n) => Number.isFinite(n));
    const base = Number.isFinite(startIndex) ? startIndex : 0;
    const results = await Promise.all(
      ids.map((id, i) =>
        supabase.from("books").update({ sort_order: base + i }).eq("id", id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) return { error: failed.error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "순서 변경에 실패했습니다." };
  }
  revalidatePath("/admin/books");
  revalidatePath("/");
  return {};
}

export async function setCommentHidden(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const hidden = String(formData.get("hidden")) === "true";
  if (Number.isFinite(id)) {
    await supabase.from("comments").update({ hidden }).eq("id", id);
    revalidatePath("/admin/comments");
  }
}

/**
 * 회원 이메일을 관리자가 수동으로 인증 처리 (Supabase 메일이 안 갈 때 임시 우회).
 * SERVICE_ROLE_KEY로 admin API 호출.
 */
export async function confirmMemberEmail(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }
  const admin = createSbClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true });
  if (error) throw new Error("이메일 인증 처리 실패: " + error.message);

  revalidatePath(`/admin/members/${userId}`);
  revalidatePath("/admin/members");
}
