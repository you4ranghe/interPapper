"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Coverflow from "@/components/Coverflow";
import Discussion from "@/components/Discussion";
import { createClient } from "@/lib/supabase/client";
import { buildCommentTree, COMMENT_SELECT, type RawComment } from "@/lib/comments";
import type { Book, BookSummary, CommentNode } from "@/lib/types";

type Props = {
  books: BookSummary[];
  userId: string | null;
  userName: string | null;
  emailVerified: boolean;
};

export default function LibraryHome({ books, userId, userName, emailVerified }: Props) {
  const supabase = createClient();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const loadComments = useCallback(
    async (bookId: number) => {
      const { data } = await supabase
        .from("comments")
        .select(COMMENT_SELECT)
        .eq("book_id", bookId)
        .order("created_at", { ascending: true });
      setComments(buildCommentTree((data as unknown as RawComment[]) ?? []));
    },
    [supabase]
  );

  const selectBook = useCallback(
    async (id: number) => {
      setLoading(true);
      setRevealed(true);
      const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
      setBook((data as Book) ?? null);
      await loadComments(id);
      setLoading(false);
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [supabase, loadComments]
  );

  useEffect(() => {
    function onScroll() {
      setShowTop(revealed && window.scrollY > window.innerHeight * 0.6);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealed]);

  function backToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      <section className="hero" id="top">
        <header className="site-header">
          <p className="eyebrow">Interpaper Library</p>
          <h1>아버지의 서재</h1>
          <div className="divider" />
          <p>가운데 책을 클릭하면, 책 뒤의 이야기가 아래로 펼쳐집니다.</p>
        </header>
        <Coverflow books={books} onSelect={selectBook} />
      </section>

      {revealed && (
        <div ref={detailRef} className={`reveal-wrap${book ? " on" : ""}`}>
          {/* 책 소개 */}
          <section className="detail-section">
            {loading && !book ? (
              <p className="lib-loading">책을 펼치는 중…</p>
            ) : book ? (
              <div className="detail-card">
                <div className="cover-col">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={book.cover_path ?? "/covers/book1.svg"} alt={`${book.title} 표지`} />
                </div>
                <div className="text-col">
                  <p className="kicker">
                    {book.book_type ?? "Book"}
                    {book.published_year ? ` · ${book.published_year}` : ""}
                  </p>
                  <h2>{book.title}</h2>
                  <div className="intro">{book.introduction}</div>
                  {book.author_note && (
                    <blockquote className="author-note">
                      <span className="label">저자의 글</span>
                      <span>{book.author_note}</span>
                    </blockquote>
                  )}
                  <button
                    className="to-discuss"
                    type="button"
                    onClick={() =>
                      document.getElementById("discussion")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    저자와의 토론 보기 ↓
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {/* 저자와의 토론 */}
          {book && (
            <section className="discuss-section" id="discussion">
              <div className="discuss-wrap">
                <div className="discuss-head">
                  <p className="eyebrow">Conversation</p>
                  <h3>저자와의 토론 <span className="cnt">({countAll(comments)})</span></h3>
                  <p className="sub">차분히 머무르며, 한 줄의 감상을 건네주세요.</p>
                </div>
                <Discussion
                  bookId={book.id}
                  comments={comments}
                  userId={userId}
                  userName={userName}
                  emailVerified={emailVerified}
                  onChanged={() => loadComments(book.id)}
                />
              </div>
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        className={`side-btn${showTop ? " show" : ""}`}
        onClick={backToTop}
        aria-label="저자의 다른 책 보기"
      >
        <span className="arrow">↑</span>
        <span>저자의 다른 책 보기</span>
      </button>
    </>
  );
}

function countAll(nodes: CommentNode[]): number {
  let c = 0;
  for (const n of nodes) c += 1 + countAll(n.children);
  return c;
}
