import { createClient } from "@/lib/supabase/server";
import { setCommentHidden } from "@/app/admin/actions";
import Pagination from "@/components/admin/Pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

type SP = { q?: string; book?: string; hidden?: string; page?: string };

type Row = {
  id: number;
  content: string;
  hidden: boolean;
  created_at: string;
  book_id: number;
  profiles: { name: string | null } | null;
  books: { title: string | null } | null;
};

function fmt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));
  } catch { return iso; }
}

export default async function AdminCommentsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  const page = Math.max(1, Number(sp.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("comments")
    .select("id,content,hidden,created_at,book_id, profiles!comments_author_id_fkey(name), books(title)", { count: "exact" })
    .order("created_at", { ascending: false });
  if (sp.q) query = query.ilike("content", `%${sp.q}%`);
  if (sp.book) query = query.eq("book_id", Number(sp.book));
  if (sp.hidden === "hidden") query = query.eq("hidden", true);
  else if (sp.hidden === "visible") query = query.eq("hidden", false);

  const { data, count } = await query.range(from, to);
  const rows = (data as unknown as Row[]) ?? [];
  const total = count ?? 0;

  const { data: bookList } = await supabase.from("books").select("id,title").order("title");
  const books = (bookList as { id: number; title: string }[]) ?? [];

  return (
    <div className="admin-section">
      <div className="admin-section-head">
        <h2>댓글관리 <span className="cnt">{total}</span></h2>
      </div>

      <form key={`${sp.q ?? ""}|${sp.book ?? ""}|${sp.hidden ?? ""}`} className="filter-bar" method="get">
        <input type="text" name="q" placeholder="내용 검색" defaultValue={sp.q ?? ""} />
        <select name="book" defaultValue={sp.book ?? ""}>
          <option value="">전체 책</option>
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
        <select name="hidden" defaultValue={sp.hidden ?? ""}>
          <option value="">전체 상태</option>
          <option value="visible">노출중</option>
          <option value="hidden">숨김</option>
        </select>
        <button className="btn" type="submit">검색</button>
        <a className="btn ghost" href="/admin/comments">초기화</a>
      </form>

      {rows.length === 0 ? (
        <p className="admin-empty">조건에 맞는 댓글이 없습니다.</p>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr><th>책</th><th>작성자</th><th>내용</th><th>작성일</th><th>노출 / 숨김</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.hidden ? "is-hidden" : ""}>
                  <td>{r.books?.title ?? "-"}</td>
                  <td>{r.profiles?.name ?? "익명"}</td>
                  <td className="cell-content">{r.content}</td>
                  <td className="nowrap">{fmt(r.created_at)}</td>
                  <td>
                    <form action={setCommentHidden}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="hidden" value={(!r.hidden).toString()} />
                      <button
                        type="submit"
                        role="switch"
                        aria-checked={!r.hidden}
                        className={`hswitch${!r.hidden ? " on" : ""}`}
                        title={r.hidden ? "숨김 상태 — 클릭하면 노출" : "노출 상태 — 클릭하면 숨김"}
                      >
                        <span className="hswitch-track"><span className="hswitch-knob" /></span>
                        <span className="hswitch-label">{r.hidden ? "숨김" : "노출"}</span>
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            basePath="/admin/comments"
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            params={{ q: sp.q, book: sp.book, hidden: sp.hidden }}
          />
        </>
      )}
    </div>
  );
}
