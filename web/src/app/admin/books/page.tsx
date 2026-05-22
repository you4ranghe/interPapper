import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";

export const dynamic = "force-dynamic";

type SP = { q?: string; type?: string; year?: string };

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("books").select("*").order("created_at", { ascending: false });
  if (sp.q) query = query.ilike("title", `%${sp.q}%`);
  if (sp.type) query = query.eq("book_type", sp.type);
  if (sp.year) query = query.eq("published_year", Number(sp.year));
  const { data } = await query;
  const books = (data as Book[]) ?? [];

  // 필터 옵션
  const { data: allTypes } = await supabase.from("books").select("book_type");
  const types = Array.from(
    new Set(((allTypes as { book_type: string | null }[]) ?? []).map((r) => r.book_type).filter(Boolean))
  ) as string[];
  const { data: allYears } = await supabase.from("books").select("published_year");
  const years = Array.from(
    new Set(((allYears as { published_year: number | null }[]) ?? []).map((r) => r.published_year).filter(Boolean))
  ).sort((a, b) => (b as number) - (a as number)) as number[];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>책관리 <span className="cnt">{books.length}</span></h2>
        <Link className="btn" href="/admin/books/new">+ 새 책 등록</Link>
      </div>

      <form className="filter-bar" method="get">
        <input type="text" name="q" placeholder="제목 검색" defaultValue={sp.q ?? ""} />
        <select name="type" defaultValue={sp.type ?? ""}>
          <option value="">전체 타입</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="year" defaultValue={sp.year ?? ""}>
          <option value="">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <button className="btn" type="submit">검색</button>
        <Link className="btn ghost" href="/admin/books">초기화</Link>
      </form>

      {books.length === 0 ? (
        <p className="admin-empty">조건에 맞는 책이 없습니다.</p>
      ) : (
        <div className="book-grid">
          {books.map((b) => (
            <Link key={b.id} href={`/admin/books/${b.id}`} className="book-card">
              <div className="bc-cover">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.cover_path ?? "/covers/book1.svg"} alt={b.title} />
              </div>
              <div className="bc-meta">
                <div className="bc-title">{b.title}</div>
                <div className="bc-sub">{b.book_type ?? "-"}{b.published_year ? ` · ${b.published_year}` : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
