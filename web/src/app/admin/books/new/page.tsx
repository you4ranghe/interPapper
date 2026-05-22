import Link from "next/link";
import BookForm from "@/components/admin/BookForm";
import { createBook } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default function NewBookPage() {
  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>새 책 등록</h2>
        <Link className="btn ghost" href="/admin/books">← 목록</Link>
      </div>
      <BookForm action={createBook} submitLabel="등록하기" />
    </div>
  );
}
