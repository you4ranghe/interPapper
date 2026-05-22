import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BookForm from "@/components/admin/BookForm";
import { updateBook, deleteBook } from "@/app/admin/actions";
import type { Book } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").eq("id", Number(id)).maybeSingle();
  if (!data) notFound();
  const book = data as Book;

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>책 수정</h2>
        <Link className="btn ghost" href="/admin/books">← 목록</Link>
      </div>

      <BookForm action={updateBook} initial={book} submitLabel="저장하기" />

      <form action={deleteBook} className="danger-zone">
        <input type="hidden" name="id" value={book.id} />
        <span>이 책과 연결된 댓글도 함께 삭제됩니다.</span>
        <button className="btn danger" type="submit">책 삭제</button>
      </form>
    </div>
  );
}
