"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

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

    const { error } = await supabase.from("books").insert({
      title, introduction, author_note, book_type, published_year, cover_path,
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

export async function setCommentHidden(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = Number(formData.get("id"));
  const hidden = String(formData.get("hidden")) === "true";
  if (Number.isFinite(id)) {
    await supabase.from("comments").update({ hidden }).eq("id", id);
    revalidatePath("/admin/comments");
  }
}
