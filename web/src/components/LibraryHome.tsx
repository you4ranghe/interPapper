"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Coverflow from "@/components/Coverflow";
import Discussion from "@/components/Discussion";
import { createClient } from "@/lib/supabase/client";
import { buildCommentTree, COMMENT_SELECT, type RawComment } from "@/lib/comments";
import { smoothScrollTo, smoothScrollToElement } from "@/lib/smoothScroll";
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
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null); // null = 전체
  const detailRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const b of books) {
      const t = b.book_type?.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
    return out;
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = activeTab ? books.filter((b) => b.book_type === activeTab) : books;
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q));
    return list;
  }, [books, activeTab, query]);

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
      // 데이터 로드를 기다리지 않고 reveal/scroll 을 먼저 시작 → 페이드인과 스크롤이 동시 진행
      requestAnimationFrame(() => {
        smoothScrollToElement(detailRef.current, 700);
      });
      const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
      setBook((data as Book) ?? null);
      await loadComments(id);
      setLoading(false);
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
    smoothScrollTo(0, 850);
  }

  return (
    <div className="lib-page">
      <section className="hero" id="top">
        <header className="site-header">
          <p className="eyebrow">Interpaper Library</p>
          <h1>아버지의 서재</h1>
          <div className="divider" />
          <p>가운데 책을 클릭하면, 책 뒤의 이야기가 아래로 펼쳐집니다.</p>
        </header>
        <div className="lib-tabs-wrap">
          <div className="lib-tabs" role="tablist" aria-label="책 카테고리">
            <button
              type="button"
              role="tab"
              className={`lib-tab all${activeTab === null ? " active" : ""}`}
              aria-selected={activeTab === null}
              onClick={() => setActiveTab(null)}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                className={`lib-tab${activeTab === cat ? " active" : ""}`}
                aria-selected={activeTab === cat}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Coverflow
          books={filteredBooks}
          onSelect={selectBook}
          emptyMessage={query.trim() ? "일치하는 책이 없습니다." : undefined}
        />

        <div className="lib-search" role="search">
          <input
            type="search"
            className="lib-search-input"
            placeholder="책 이름으로 찾기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="책 이름 검색"
            autoComplete="off"
          />
          {query.trim() && (
            <span
              className={`lib-search-status${filteredBooks.length === 0 ? " miss" : ""}`}
              aria-live="polite"
            >
              {filteredBooks.length > 0
                ? `${filteredBooks.length}권 일치`
                : "일치하는 책이 없습니다"}
            </span>
          )}
        </div>
      </section>

      {revealed && (
        <div ref={detailRef} className={`reveal-wrap${revealed ? " on" : ""}`}>
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
                      smoothScrollToElement(document.getElementById("discussion"), 700)
                    }
                  >
                    <span>저자와의 토론 보기</span>
                    <span className="arrow" aria-hidden>↓</span>
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
    </div>
  );
}

function countAll(nodes: CommentNode[]): number {
  let c = 0;
  for (const n of nodes) c += 1 + countAll(n.children);
  return c;
}
