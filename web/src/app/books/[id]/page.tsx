import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import BookCover from "@/components/BookCover";
import LogoutButton from "@/components/LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";
import Discussion from "@/components/Discussion";
import { buildCommentTree, COMMENT_SELECT, type RawComment } from "@/lib/comments";
import type { Book } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

// 링크 공유(카톡 등) 시 책 제목·소개·표지가 미리보기로 뜨도록 OG 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const bookId = Number(id);
  if (!Number.isFinite(bookId)) return {};

  const supabase = await createClient();
  const { data } = await supabase
    .from("books")
    .select("title,introduction,cover_path")
    .eq("id", bookId)
    .maybeSingle();
  if (!data) return {};

  const title = `${data.title} · 바우치 서재(書齋)`;
  const description = (data.introduction ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "book",
      images: data.cover_path ? [{ url: data.cover_path }] : undefined,
    },
  };
}

export default async function BookDetailPage({ params }: PageProps) {
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
    .select(COMMENT_SELECT)
    .eq("book_id", bookId)
    .order("created_at", { ascending: true });

  const tree = buildCommentTree((rows as unknown as RawComment[]) ?? []);
  const count = (rows ?? []).length;

  return (
    <div className="detail-page">
      <div className="top-actions">
        <ThemeToggle />
        <Link className="pill-btn" href="/library">← 서재로</Link>
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
            <BookCover
              src={b.cover_path}
              alt={`${b.title} 표지`}
              sizes="(max-width: 768px) 82vw, 360px"
              priority
            />
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
            userAvatarUrl={session.profile?.avatar_url ?? null}
            emailVerified={session.emailVerified}
          />
        </div>
      </section>
    </div>
  );
}
