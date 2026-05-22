"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookSummary } from "@/lib/types";

const mod = (a: number, m: number) => ((a % m) + m) % m;

function posClass(offset: number): string {
  if (offset === 0) return "pos-0";
  if (offset === -1) return "pos-l1";
  if (offset === 1) return "pos-r1";
  if (offset === -2) return "pos-l2";
  if (offset === 2) return "pos-r2";
  return "pos-hidden";
}

export default function Coverflow({ books }: { books: BookSummary[] }) {
  const router = useRouter();
  const n = books.length;
  const [pointer, setPointer] = useState(n);
  const [ready, setReady] = useState(false);
  const [noAnim, setNoAnim] = useState(false);
  const rebaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // 순환 범위 [n, 2n) 으로 pointer 정규화 (애니메이션 없이)
  const scheduleRebase = useCallback(() => {
    if (rebaseTimer.current) clearTimeout(rebaseTimer.current);
    rebaseTimer.current = setTimeout(() => {
      setPointer((p) => {
        const canonical = n + mod(p - n, n);
        if (canonical !== p) setNoAnim(true);
        return canonical;
      });
    }, 640);
  }, [n]);

  // noAnim 적용 후 다음 프레임에 해제 → 트랜지션 복원
  useEffect(() => {
    if (!noAnim) return;
    const t = requestAnimationFrame(() => setNoAnim(false));
    return () => cancelAnimationFrame(t);
  }, [noAnim]);

  const moveTo = useCallback(
    (p: number) => {
      setPointer(p);
      scheduleRebase();
    },
    [scheduleRebase]
  );

  const goPrev = useCallback(() => moveTo(pointer - 1), [moveTo, pointer]);
  const goNext = useCallback(() => moveTo(pointer + 1), [moveTo, pointer]);

  const openBook = useCallback(
    (id: number) => router.push(`/books/${id}`),
    [router]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  if (n === 0) {
    return (
      <div className="coverflow">
        <div className="cf-empty">
          아직 등록된 책이 없습니다.
          <br />
          <span style={{ fontSize: ".85rem", color: "#9c855a" }}>
            관리자가 ‘서재관리’에서 책을 등록하면 이곳에 진열됩니다.
          </span>
        </div>
      </div>
    );
  }

  // 무한 순환을 위해 3벌 복제
  const items = Array.from({ length: n * 3 }, (_, k) => ({
    key: k,
    book: books[k % n],
  }));
  const active = books[mod(pointer, n)];

  return (
    <div className="coverflow">
      <button className="cf-nav cf-prev" type="button" aria-label="이전 책" onClick={goPrev}>
        &#8249;
      </button>

      <div className={`cf-stage${ready ? " ready" : ""}${noAnim ? " no-anim" : ""}`}>
        {items.map(({ key, book }) => {
          const offset = key - pointer;
          const cls = posClass(offset);
          const onClick = () => {
            if (key === pointer) openBook(book.id);
            else moveTo(key);
          };
          return (
            <article
              key={key}
              className={`cf-item ${cls}`}
              role="button"
              tabIndex={cls === "pos-hidden" ? -1 : 0}
              aria-label={book.title}
              onClick={onClick}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={book.cover_path ?? "/covers/book1.svg"} alt={`${book.title} 표지`} />
            </article>
          );
        })}
      </div>

      <button className="cf-nav cf-next" type="button" aria-label="다음 책" onClick={goNext}>
        &#8250;
      </button>

      <div className="cf-caption">
        <div className="pill">
          <span className="t">{active.title}</span>
          <span className="s">클릭하여 펼치기 · {mod(pointer, n) + 1} / {n}</span>
        </div>
      </div>

      <div className="cf-dots">
        {books.map((b, i) => (
          <button
            key={b.id}
            type="button"
            className={`dot${i === mod(pointer, n) ? " active" : ""}`}
            aria-label={`${i + 1}번째 책`}
            onClick={() => moveTo(n + i)}
          />
        ))}
      </div>
    </div>
  );
}
