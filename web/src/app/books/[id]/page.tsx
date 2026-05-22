import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Discussion from "@/components/Discussion";
import type { Book, CommentNode } from "@/lib/types";

export const dynamic = "force-dynamic";

type RawComment = {
  id: number;
  book_id: number;
  parent_id: number | null;
  author_id: string;
  content: string;
  hidden: boolean;
  created_at: string;
  profiles: { name: string | null } | null;
};

function buildTree(rows: RawComment[]): CommentNode[] {
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      book_id: r.book_id,
      parent_id: r.parent_id,
      author_id: r.author_id,
      author_name: r.profiles?.name || "익명",
      content: r.content,
      hidden: r.hidden,
      created_at: r.created_at,
      children: [],
    });
  }
  for (const r of rows) {
    const node = byId.get(r.id)!;
    if (r.parent_id && byId.has(r.parent_id)) byId.get(r.parent_id)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookId = Number(id);
  if (!Number.isFinite(bookId)) notFound();

  const session = await getSession();
  const supabase = await createClient();

  const { data: book } = await supabase
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();
  if (!book) notFound();
  const b = book as Book;

  const { data: rows } = await supabase
    .from("comments")
    .select("id,book_id,parent_id,author_id,content,hidden,created_at, profiles(name)")
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  const tree = buildTree((rows as unknown as RawComment[]) ?? []);
  const count = (rows ?? []).length;

  return (
    <div className="detail-page">
      <div className="top-actions">
        <Link className="pill-btn" href="/">← 서재로</Link>
        {session.userId ? (
          <>
            {session.isAdmin && <Link className="pill-btn solid" href="/admin">서재관리</Link>}
            <LogoutButton />
          </>
        ) : (
          <>
            <Link className="pill-btn" href="/login">로그인</Link>
            <Link className="pill-btn solid" href="/signup">회원가입</Link>
          </>
        )}
      </div>

      {/* 책 소개 */}
      <section className="detail-section">
        <div className="detail-card">
          <div className="cover-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.cover_path ?? "/covers/book1.svg"} alt={`${b.title} 표지`} />
          </div>
          <div className="text-col">
            <p className="kicker">{b.book_type ?? "Book"}{b.published_year ? ` · ${b.published_year}` : ""}</p>
            <h2>{b.title}</h2>
            <div className="intro">{b.introduction}</div>
            {b.author_note && (
              <blockquote className="author-note">
                <span className="label">저자의 글</span>
                <span>{b.author_note}</span>
              </blockquote>
            )}
          </div>
        </div>
      </section>

      {/* 저자와의 토론 */}
      <section className="discuss-section">
        <div className="discuss-wrap">
          <div className="discuss-head">
            <p className="eyebrow">Conversation</p>
            <h3>저자와의 토론 <span className="cnt">({count})</span></h3>
            <p className="sub">차분히 머무르며, 한 줄의 감상을 건네주세요.</p>
          </div>
          <Discussion
            bookId={bookId}
            comments={tree}
            userId={session.userId}
            userName={session.profile?.name ?? null}
            emailVerified={session.emailVerified}
          />
        </div>
      </section>
    </div>
  );
}
