import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Book } from "@/lib/types";
import Pagination from "@/components/admin/Pagination";
import BookGridSortable from "@/components/admin/BookGridSortable";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SP = { q?: string; type?: string; year?: string; status?: string; page?: string };

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("books")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (sp.q) query = query.ilike("title", `%${sp.q}%`);
  if (sp.type) query = query.eq("book_type", sp.type);
  if (sp.year) query = query.eq("published_year", Number(sp.year));
  if (sp.status === "1") query = query.eq("is_published", true);
  if (sp.status === "0") query = query.eq("is_published", false);
  const { data, count } = await query.range(from, to);
  const books = (data as Book[]) ?? [];
  const total = count ?? 0;

  // 필터/검색이 걸려 있으면 부분집합이라 전역 순서가 어긋날 수 있어 드래그 정렬을 막는다.
  const reorderable = !sp.q && !sp.type && !sp.year && !sp.status;

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
        <h2>책관리 <span className="cnt">{total}</span></h2>
        <Link className="btn" href="/admin/books/new">+ 새 책 등록</Link>
      </div>

      <form key={`${sp.q ?? ""}|${sp.type ?? ""}|${sp.year ?? ""}|${sp.status ?? ""}`} className="filter-bar" method="get">
        <input type="text" name="q" placeholder="제목 검색" defaultValue={sp.q ?? ""} />
        <select name="type" defaultValue={sp.type ?? ""}>
          <option value="">전체 타입</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select name="year" defaultValue={sp.year ?? ""}>
          <option value="">전체 연도</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""}>
          <option value="">노출 전체</option>
          <option value="1">노출 중</option>
          <option value="0">숨김</option>
        </select>
        <button className="btn" type="submit">검색</button>
        <Link className="btn ghost" href="/admin/books">초기화</Link>
      </form>

      {books.length === 0 ? (
        <p className="admin-empty">조건에 맞는 책이 없습니다.</p>
      ) : (
        <>
          <BookGridSortable books={books} startIndex={from} reorderable={reorderable} />
          <Pagination
            basePath="/admin/books"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            params={{ q: sp.q, type: sp.type, year: sp.year, status: sp.status }}
          />
        </>
      )}
    </div>
  );
}
