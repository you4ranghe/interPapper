"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Discussion from "@/components/Discussion";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/client";
import { buildCommentTree, COMMENT_SELECT, type RawComment } from "@/lib/comments";
import type { Book, BookSummary, CommentNode } from "@/lib/types";
import styles from "./library2.module.css";

type Props = {
  books: BookSummary[];
  userId: string | null;
  userName: string | null;
  userDisplay: string | null;
  emailVerified: boolean;
  isAdmin?: boolean;
};

const ACCENT_LABEL = "아버지의 서재 · v2 / Supanova edition";

function bentoSpan(index: number, total: number): string {
  // Asymmetric pattern: 12-col grid on desktop.
  // 0: large hero card (col-span-7 row-span-2), 1: tall (col-span-5 row-span-2),
  // then alternating: 5/4/3 widths in 12-col rhythm.
  const pattern = [
    styles.tileXL,
    styles.tileL,
    styles.tileM,
    styles.tileS,
    styles.tileS,
    styles.tileM,
    styles.tileM,
    styles.tileS,
    styles.tileS,
  ];
  if (index === 0) return styles.tileXL;
  if (index === 1) return styles.tileL;
  // After first two, cycle through subtle rhythm so 3, 4, 5, ... feel varied.
  if (total <= 5) return styles.tileM;
  return pattern[(index + 2) % pattern.length];
}

function countAll(nodes: CommentNode[]): number {
  let c = 0;
  for (const n of nodes) c += 1 + countAll(n.children);
  return c;
}

export default function Library2({
  books,
  userId,
  userName,
  userDisplay,
  emailVerified,
  isAdmin = false,
}: Props) {
  const supabase = createClient();
  const [book, setBook] = useState<Book | null>(null);
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const lastDeepLinkRef = useRef<string>("");

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

  const featured = books[0] ?? null;

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
    async (id: number, opts?: { jumpToDiscussion?: boolean }) => {
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
          created_at: "",
        });
      }
      setComments([]);
      setLoading(true);
      setSheetOpen(true);
      document.documentElement.style.overflow = "hidden";

      const [detail] = await Promise.all([
        supabase.from("books").select("*").eq("id", id).maybeSingle(),
        loadComments(id),
      ]);
      setBook((detail.data as Book) ?? null);
      setLoading(false);

      if (opts?.jumpToDiscussion) {
        requestAnimationFrame(() => {
          const el = sheetRef.current?.querySelector(`.${styles.sheetDiscuss}`);
          if (el instanceof HTMLElement) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    },
    [books, supabase, loadComments]
  );

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    document.documentElement.style.overflow = "";
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && sheetOpen) closeSheet();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, closeSheet]);

  useEffect(() => {
    if (highlightId == null) return;
    const id = window.setTimeout(() => setHighlightId(null), 4000);
    return () => window.clearTimeout(id);
  }, [highlightId]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // IntersectionObserver-based stagger reveal for any [data-reveal] element.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.revealOn = "1";
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filteredBooks, sheetOpen]);

  const handleDeepLink = useCallback(
    (bid: number, discuss: boolean, hl: number | null) => {
      const key = `${bid}|${discuss ? "1" : ""}|${hl ?? ""}`;
      if (lastDeepLinkRef.current === key) return;
      lastDeepLinkRef.current = key;
      setHighlightId(hl);
      selectBook(bid, { jumpToDiscussion: discuss });
    },
    [selectBook]
  );

  const totalCount = books.length;
  const filteredCount = filteredBooks.length;

  return (
    <div className={styles.root}>
      {/* Ambient mesh + grain (fixed, GPU-friendly) */}
      <div className={styles.ambient} aria-hidden>
        <span className={`${styles.orb} ${styles.orbA}`} />
        <span className={`${styles.orb} ${styles.orbB}`} />
        <span className={`${styles.orb} ${styles.orbC}`} />
      </div>
      <div className={styles.grain} aria-hidden />

      {/* Floating glass navigation */}
      <header className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.navBrand}>
            <span className={styles.navMark} aria-hidden>◐</span>
            <span className={styles.navBrandText}>Interpaper</span>
            <span className={styles.navBadge}>v2 · test</span>
          </Link>
          <nav className={styles.navLinks} aria-label="주요 메뉴">
            <Link href="/library" className={styles.navLink}>
              v1 서재 보기
            </Link>
            <a href="#catalog" className={styles.navLink}>카탈로그</a>
            <a href="#manifesto" className={styles.navLink}>저자 노트</a>
          </nav>
          <div className={styles.navActions}>
            {isAdmin && (
              <Link href="/admin" className={`${styles.btn} ${styles.btnGhost}`}>
                <span>서재관리</span>
              </Link>
            )}
            {userId ? (
              <>
                <span className={styles.userPill} title={userDisplay ?? undefined}>
                  <span className={styles.userDot} aria-hidden />
                  <span className={styles.userName}>{userDisplay}</span>
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className={`${styles.btn} ${styles.btnGhost}`}>
                  로그인
                </Link>
                <Link href="/signup" className={`${styles.btn} ${styles.btnAccent}`}>
                  <span>회원가입</span>
                  <span className={styles.btnArrowWrap} aria-hidden>
                    <span className={styles.btnArrow}>→</span>
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero — Editorial Split */}
      <section className={styles.hero} id="top">
        <div className={styles.heroInner}>
          <div className={styles.heroLeft} data-reveal>
            <span className={styles.eyebrow}>{ACCENT_LABEL}</span>
            <h1 className={styles.heroTitle}>
              한 권의 책에서<br />
              저자와 마주 앉는<br />
              <em className={styles.heroAccent}>조용한 시간.</em>
            </h1>
            <p className={styles.heroLede}>
              종이의 결을 그대로 옮긴 디지털 서재. {totalCount.toLocaleString()}권의 저서를 펼치고,
              한 줄의 감상을 저자에게 직접 건네보세요.
            </p>
            <div className={styles.heroCtas}>
              <a href="#catalog" className={`${styles.btn} ${styles.btnAccent} ${styles.btnLg}`}>
                <span>서재 둘러보기</span>
                <span className={styles.btnArrowWrap} aria-hidden>
                  <span className={styles.btnArrow}>↓</span>
                </span>
              </a>
              <a href="#manifesto" className={`${styles.btn} ${styles.btnGhost} ${styles.btnLg}`}>
                저자의 노트
              </a>
            </div>
            <dl className={styles.heroMetrics}>
              <div>
                <dt>저서</dt>
                <dd>
                  <span className={styles.metricNum}>{totalCount.toLocaleString()}</span>
                  <span className={styles.metricUnit}>권</span>
                </dd>
              </div>
              <div>
                <dt>주제</dt>
                <dd>
                  <span className={styles.metricNum}>{categories.length || 1}</span>
                  <span className={styles.metricUnit}>갈래</span>
                </dd>
              </div>
              <div>
                <dt>대화</dt>
                <dd>
                  <span className={styles.metricNum}>{userId ? "열림" : "참여중"}</span>
                </dd>
              </div>
            </dl>
          </div>

          <div className={styles.heroRight} data-reveal>
            {featured ? (
              <button
                type="button"
                className={`${styles.bezel} ${styles.featuredCard}`}
                onClick={() => selectBook(featured.id)}
              >
                <span className={styles.bezelInner}>
                  <span className={styles.featuredKicker}>
                    <span className={styles.dot} aria-hidden />
                    이번 주 추천
                  </span>
                  <span className={styles.featuredCover}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featured.cover_path ?? "/covers/book1.svg"}
                      alt={`${featured.title} 표지`}
                      loading="eager"
                      decoding="async"
                    />
                  </span>
                  <span className={styles.featuredMeta}>
                    <span className={styles.featuredType}>{featured.book_type ?? "Essay"}</span>
                    <span className={styles.featuredTitle}>{featured.title}</span>
                    <span className={styles.featuredCta}>
                      펼쳐서 읽기
                      <span className={styles.featuredCtaArrow} aria-hidden>→</span>
                    </span>
                  </span>
                </span>
              </button>
            ) : (
              <div className={`${styles.bezel} ${styles.featuredCard} ${styles.featuredEmpty}`}>
                <span className={styles.bezelInner}>
                  <span className={styles.featuredKicker}>아직 등록된 책이 없습니다</span>
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catalog — Filter bar + Bento grid */}
      <section className={styles.catalog} id="catalog">
        <div className={styles.sectionHead} data-reveal>
          <span className={styles.eyebrow}>Catalogue</span>
          <h2 className={styles.sectionTitle}>
            저자의 책 <span className={styles.sectionCount}>{filteredCount}</span>
          </h2>
          <p className={styles.sectionSub}>
            갈래로 좁히거나, 제목으로 직접 찾을 수 있어요. 카드를 누르면 책이 펼쳐집니다.
          </p>
        </div>

        <div className={styles.toolbar} data-reveal>
          <div className={styles.tabs} role="tablist" aria-label="책 갈래">
            <button
              type="button"
              role="tab"
              className={`${styles.tab} ${activeTab === null ? styles.tabActive : ""}`}
              aria-selected={activeTab === null}
              onClick={() => setActiveTab(null)}
            >
              전체
              <span className={styles.tabCount}>{books.length}</span>
            </button>
            {categories.map((cat) => {
              const n = books.filter((b) => b.book_type === cat).length;
              const active = activeTab === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  className={`${styles.tab} ${active ? styles.tabActive : ""}`}
                  aria-selected={active}
                  onClick={() => setActiveTab(cat)}
                >
                  {cat}
                  <span className={styles.tabCount}>{n}</span>
                </button>
              );
            })}
          </div>

          <label className={styles.search}>
            <span className={styles.searchIcon} aria-hidden>⌕</span>
            <input
              type="search"
              placeholder="책 이름으로 찾기"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="책 이름 검색"
              autoComplete="off"
            />
            {query.trim() && (
              <span
                className={`${styles.searchStatus} ${filteredCount === 0 ? styles.searchMiss : ""}`}
                aria-live="polite"
              >
                {filteredCount > 0 ? `${filteredCount}권` : "결과 없음"}
              </span>
            )}
          </label>
        </div>

        {filteredBooks.length === 0 ? (
          <div className={styles.empty} data-reveal>
            <p>{query.trim() ? "일치하는 책이 없습니다." : "곧 새로운 책이 더해질 예정입니다."}</p>
          </div>
        ) : (
          <ul className={styles.bento}>
            {filteredBooks.map((b, i) => (
              <li
                key={b.id}
                className={`${styles.tile} ${bentoSpan(i, filteredBooks.length)}`}
                style={{ ["--i" as string]: i % 12 }}
                data-reveal
              >
                <button
                  type="button"
                  className={`${styles.bezel} ${styles.tileBtn}`}
                  onClick={() => selectBook(b.id)}
                >
                  <span className={styles.bezelInner}>
                    <span className={styles.tileCover}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.cover_path ?? "/covers/book1.svg"}
                        alt={`${b.title} 표지`}
                        loading={i < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                      <span className={styles.tileGlow} aria-hidden />
                    </span>
                    <span className={styles.tileBody}>
                      <span className={styles.tileType}>{b.book_type ?? "Book"}</span>
                      <span className={styles.tileTitle}>{b.title}</span>
                      <span className={styles.tileCta}>
                        펼쳐보기
                        <span className={styles.tileArrowWrap} aria-hidden>
                          <span className={styles.tileArrow}>→</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Manifesto strip */}
      <section className={styles.manifesto} id="manifesto">
        <div className={`${styles.bezel} ${styles.manifestoCard}`} data-reveal>
          <span className={styles.bezelInner}>
            <span className={styles.eyebrow}>Author&apos;s Note</span>
            <p className={styles.manifestoQuote}>
              &ldquo;책은 한 번 인쇄되면 끝나는 물건이 아니다.<br />
              읽는 사람의 시간 위에서 매번 다르게 다시 태어난다.&rdquo;
            </p>
            <div className={styles.manifestoMeta}>
              <span className={styles.manifestoAvatar} aria-hidden>저</span>
              <span>
                <strong>저자의 한 줄</strong>
                <small>2026년 봄, 서재에서</small>
              </span>
            </div>
          </span>
        </div>
      </section>

      <footer className={styles.foot}>
        <p>
          이 페이지는 <code>/library</code> 와 별개의 디자인 비교용입니다 ·{" "}
          <Link href="/library">기존 서재로 돌아가기 →</Link>
        </p>
      </footer>

      {/* Slide-up sheet for book detail + discussion */}
      <div
        className={`${styles.sheetBackdrop} ${sheetOpen ? styles.sheetOpen : ""}`}
        onClick={closeSheet}
        aria-hidden
      />
      <aside
        ref={sheetRef}
        className={`${styles.sheet} ${sheetOpen ? styles.sheetOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={book ? `${book.title} 상세` : "책 상세"}
      >
        <div className={styles.sheetHandle} aria-hidden />
        <button
          type="button"
          className={styles.sheetClose}
          onClick={closeSheet}
          aria-label="닫기"
        >
          ✕
        </button>

        {book && (
          <div className={styles.sheetBody}>
            <div className={`${styles.bezel} ${styles.sheetDetail}`}>
              <div className={styles.bezelInner}>
                <div className={styles.sheetCover}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={book.cover_path ?? "/covers/book1.svg"}
                    alt={`${book.title} 표지`}
                  />
                </div>
                <div className={styles.sheetText}>
                  <span className={styles.eyebrow}>
                    {book.book_type ?? "Book"}
                    {book.published_year ? ` · ${book.published_year}` : ""}
                  </span>
                  <h3 className={styles.sheetTitle}>{book.title}</h3>
                  {loading && !book.introduction ? (
                    <p className={styles.sheetLoading}>책을 펼치는 중…</p>
                  ) : (
                    <div className={styles.sheetIntro}>{book.introduction}</div>
                  )}
                  {book.author_note && (
                    <blockquote className={styles.sheetNote}>
                      <span className={styles.eyebrow}>저자의 글</span>
                      <p>{book.author_note}</p>
                    </blockquote>
                  )}
                </div>
              </div>
            </div>

            <section className={styles.sheetDiscuss}>
              <header className={styles.sheetDiscussHead}>
                <span className={styles.eyebrow}>Conversation</span>
                <h4>
                  저자와의 토론{" "}
                  <span className={styles.sheetDiscussCount}>({countAll(comments)})</span>
                </h4>
                <p>차분히 머무르며, 한 줄의 감상을 건네주세요.</p>
              </header>
              <div className={styles.sheetDiscussBody}>
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
          </div>
        )}
      </aside>

      <Suspense fallback={null}>
        <DeepLinkReader onDeepLink={handleDeepLink} />
      </Suspense>
    </div>
  );
}

function DeepLinkReader({
  onDeepLink,
}: {
  onDeepLink: (bid: number, discuss: boolean, hl: number | null) => void;
}) {
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
