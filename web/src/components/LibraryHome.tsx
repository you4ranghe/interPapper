"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Coverflow from "@/components/Coverflow";
import Discussion from "@/components/Discussion";
import AuthorNote from "@/components/AuthorNote";
import ScrollToTop from "@/components/ScrollToTop";
import { createClient } from "@/lib/supabase/client";
import { buildCommentTree, COMMENT_SELECT, type RawComment } from "@/lib/comments";
import { smoothScrollToElement } from "@/lib/smoothScroll";
import type { Book, BookListItem, CommentNode } from "@/lib/types";

type Props = {
  books: BookListItem[];
  userId: string | null;
  userName: string | null;
  emailVerified: boolean;
  isAdmin?: boolean;
};

export default function LibraryHome({ books, userId, userName, emailVerified, isAdmin = false }: Props) {
  const supabase = createClient();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null); // null = 전체
  const [gridView, setGridView] = useState(true); // true = 전체보기(그리드, 기본값), false = 표지 넘기기(coverflow)
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const lastDeepLinkRef = useRef<string>("");
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

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
    async (id: number, opts?: { scrollTo?: "detail" | "discussion" }) => {
      // 낙관적 렌더: 목록에 이미 있는 정보로 카드를 즉시 보여주고 상세는 뒤따라 채움.
      const summary = books.find((b) => b.id === id);
      if (summary) {
        setBook({
          id: summary.id,
          title: summary.title,
          cover_path: summary.cover_path,
          book_type: summary.book_type,
          introduction: "",
          author_note: "",
          published_year: null,
          is_published: true,
          purchase_links: [],
          sort_order: null,
          created_at: "",
        });
      }
      setComments([]);
      setLoading(true);
      setRevealed(true);
      // 펼침 영역이 마운트된 뒤 스크롤해야 하므로, 대상 요소가 생길 때까지 프레임마다 재시도.
      const target = opts?.scrollTo ?? "detail";
      let tries = 0;
      const tryScroll = () => {
        const el =
          target === "discussion"
            ? document.getElementById("discussion")
            : detailRef.current;
        if (el) {
          smoothScrollToElement(el, 420);
          return;
        }
        if (tries++ < 40) requestAnimationFrame(tryScroll);
      };
      requestAnimationFrame(tryScroll);
      // 책 상세와 댓글을 병렬로 fetch.
      const [detail] = await Promise.all([
        supabase.from("books").select("*").eq("id", id).maybeSingle(),
        loadComments(id),
      ]);
      setBook((detail.data as Book) ?? null);
      setLoading(false);
    },
    [books, supabase, loadComments]
  );

  // 알림 모달에서 ?bookId=...&discuss=1&hl=... 로 진입한 경우 자동으로 책을 펼침.
  const handleDeepLink = useCallback((bid: number, discuss: boolean, hl: number | null) => {
    const key = `${bid}|${discuss ? "1" : ""}|${hl ?? ""}`;
    if (lastDeepLinkRef.current === key) return;
    lastDeepLinkRef.current = key;
    setHighlightId(hl);
    selectBook(bid, { scrollTo: discuss ? "discussion" : "detail" });
  }, [selectBook]);

  // 하이라이트 자동 해제
  useEffect(() => {
    if (highlightId == null) return;
    const id = window.setTimeout(() => setHighlightId(null), 4000);
    return () => window.clearTimeout(id);
  }, [highlightId]);

  // 활성 탭이 가로 스크롤 영역 밖에 있으면 중앙으로 부드럽게 스크롤
  useEffect(() => {
    const tab = activeTabRef.current;
    const wrap = tabsRef.current;
    if (!tab || !wrap) return;
    const tabRect = tab.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const isOff = tabRect.left < wrapRect.left + 24 || tabRect.right > wrapRect.right - 24;
    if (isOff) {
      const target = tab.offsetLeft - wrap.clientWidth / 2 + tab.clientWidth / 2;
      wrap.scrollTo({ left: target, behavior: "smooth" });
    }
  }, [activeTab]);

  // 세그먼트형 토글 스위치: 두 라벨을 모두 보여주고, 활성 칸을 글래스 pill 이 미끄러지듯 표시.
  const viewToggle = (
    <div className="lib-segtoggle" role="tablist" aria-label="보기 방식">
      <span className="lib-segtoggle-thumb" data-pos={gridView ? "grid" : "slide"} aria-hidden />
      <button
        type="button"
        role="tab"
        aria-selected={gridView}
        aria-label="전체로 보기"
        title="전체로 보기"
        className={`lib-segbtn${gridView ? " active" : ""}`}
        onClick={() => setGridView(true)}
      >
        {/* 전체로 보기 — 격자 아이콘 */}
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.4" />
          <rect x="14" y="3" width="7" height="7" rx="1.4" />
          <rect x="3" y="14" width="7" height="7" rx="1.4" />
          <rect x="14" y="14" width="7" height="7" rx="1.4" />
        </svg>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!gridView}
        aria-label="슬라이드로 보기"
        title="슬라이드로 보기"
        className={`lib-segbtn${!gridView ? " active" : ""}`}
        onClick={() => setGridView(false)}
      >
        {/* 슬라이드로 보기 — 가운데 표지 + 양옆 표지가 비치는 코버플로우 아이콘 */}
        <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 4v16" />
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M22 4v16" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="lib-page">
      <section className={`hero${gridView ? " is-grid" : ""}`} id="top">
        <header className="site-header">
          <p className="eyebrow">Interpaper Library</p>
          <h1>아버지의 서재</h1>
          <div className="divider" />
        </header>
        <div className="lib-tabs-wrap">
          <div className="lib-tabs" role="tablist" aria-label="책 카테고리" ref={tabsRef}>
            <button
              type="button"
              role="tab"
              ref={activeTab === null ? activeTabRef : null}
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
                ref={activeTab === cat ? activeTabRef : null}
                className={`lib-tab${activeTab === cat ? " active" : ""}`}
                aria-selected={activeTab === cat}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 보기 방식 토글: 항상 같은 위치(그리드 우측 라인에 정렬)에 고정 → 모드 전환 시 흔들림 없음 */}
        <div className="lib-viewbar">{viewToggle}</div>

        {gridView ? (
          filteredBooks.length === 0 ? (
            <p className="lib-grid-empty">
              {query.trim() ? "일치하는 책이 없습니다." : "아직 등록된 책이 없습니다."}
            </p>
          ) : (
            <div className="lib-grid">
              {filteredBooks.map((b) => (
                <BookGridCard key={b.id} book={b} onOpen={() => selectBook(b.id)} />
              ))}
            </div>
          )
        ) : (
          <Coverflow
            books={filteredBooks}
            onSelect={selectBook}
            emptyMessage={query.trim() ? "일치하는 책이 없습니다." : undefined}
          />
        )}

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
                  {book.author_note && <AuthorNote key={book.id} text={book.author_note} />}
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
                  isAdmin={isAdmin}
                  highlightId={highlightId}
                  onChanged={() => loadComments(book.id)}
                />
              </div>
            </section>
          )}
        </div>
      )}

      <ScrollToTop />

      <Suspense fallback={null}>
        <DeepLinkReader onDeepLink={handleDeepLink} />
      </Suspense>
    </div>
  );
}

function DeepLinkReader({ onDeepLink }: { onDeepLink: (bid: number, discuss: boolean, hl: number | null) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const bookIdRaw = searchParams.get("bookId");
    if (!bookIdRaw) return;
    const bid = Number(bookIdRaw);
    if (!Number.isFinite(bid)) return;
    const discuss = searchParams.get("discuss") === "1";
    const hlRaw = searchParams.get("hl");
    const hl = hlRaw && Number.isFinite(Number(hlRaw)) ? Number(hlRaw) : null;
    onDeepLink(bid, discuss, hl);
  }, [searchParams, onDeepLink]);
  return null;
}

function countAll(nodes: CommentNode[]): number {
  let c = 0;
  for (const n of nodes) c += 1 + countAll(n.children);
  return c;
}

// 전체보기 그리드의 책 한 권 — 표지 + 제목 + 소개 3줄.
// 소개가 3줄을 넘으면 '+ 더보기'가 나타나고, 카드/버튼을 누르면 아래 상세로 펼쳐진다.
function BookGridCard({ book, onOpen }: { book: BookListItem; onOpen: () => void }) {
  const introRef = useRef<HTMLParagraphElement | null>(null);
  const [overflow, setOverflow] = useState(false);
  const intro = book.introduction?.trim() ?? "";

  useEffect(() => {
    const el = introRef.current;
    if (!el) return;
    // CSS로 3줄 클램프된 상태에서 실제 내용이 더 긴지(=잘렸는지) 측정.
    const measure = () => setOverflow(el.scrollHeight - el.clientHeight > 2);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [intro]);

  return (
    <article
      className="lib-card"
      role="button"
      tabIndex={0}
      aria-label={`${book.title} 자세히 보기`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="lib-card-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={book.cover_path ?? "/covers/book1.svg"} alt={`${book.title} 표지`} loading="lazy" decoding="async" />
      </div>
      <div className="lib-card-body">
        {book.book_type && <p className="lib-card-kicker">{book.book_type}</p>}
        <h3 className="lib-card-title">{book.title}</h3>
        <p className="lib-card-intro" ref={introRef}>
          {intro || "소개가 곧 추가됩니다."}
        </p>
        {overflow && (
          <button
            type="button"
            className="lib-card-more"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
          >
            + 더보기
          </button>
        )}
      </div>
    </article>
  );
}
