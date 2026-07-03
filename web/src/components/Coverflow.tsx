"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BookCover from "@/components/BookCover";
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

export default function Coverflow({
  books,
  onSelect,
  emptyMessage,
}: {
  books: BookSummary[];
  onSelect: (id: number) => void;
  emptyMessage?: string;
}) {
  const n = books.length;
  const [pointer, setPointer] = useState(n);
  const [ready, setReady] = useState(false);
  const [noAnim, setNoAnim] = useState(false);
  const rebaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // books 자체가 바뀌면(탭 필터 등) 첫 책으로 리셋. n=0 이면 무시.
  const booksRef = useRef(books);
  useEffect(() => {
    if (booksRef.current !== books && n > 0) {
      booksRef.current = books;
      setPointer(n);
      setNoAnim(true);
    }
  }, [books, n]);

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

  const openBook = useCallback((id: number) => onSelect(id), [onSelect]);

  // ===== 드래그/스와이프로 책 넘기기 (PC 마우스 + 모바일 터치) =====
  const STEP = 64; // 이 픽셀만큼 끌 때마다 한 권 이동
  const dragRef = useRef({ active: false, startX: 0, lastSteps: 0, moved: false });

  const stepBy = useCallback(
    (delta: number) => {
      if (delta === 0) return;
      setPointer((p) => p + delta);
      scheduleRebase();
    },
    [scheduleRebase]
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // setPointerCapture를 cf-stage에 호출하면 자식 <article>의 click 이벤트가
    // 디스패치되지 않아 책 클릭 → 펼치기 흐름이 끊긴다. capture 없이도 stage 내부 드래그는 정상.
    dragRef.current = { active: true, startX: e.clientX, lastSteps: 0, moved: false };
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d.active) return;
      const dx = e.clientX - d.startX;
      if (Math.abs(dx) > 6) d.moved = true;
      const steps = Math.round(dx / STEP);
      if (steps !== d.lastSteps) {
        stepBy(-(steps - d.lastSteps)); // 오른쪽으로 끌면 이전 책, 왼쪽이면 다음 책
        d.lastSteps = steps;
      }
    },
    [stepBy]
  );

  const endDrag = useCallback(() => {
    dragRef.current.active = false;
  }, []);

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
          {emptyMessage ? (
            emptyMessage
          ) : (
            <>
              아직 등록된 책이 없습니다.
              <br />
              <span style={{ fontSize: ".85rem", color: "#9c855a" }}>
                관리자가 ‘서재관리’에서 책을 등록하면 이곳에 진열됩니다.
              </span>
            </>
          )}
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

      <div
        className={`cf-stage${ready ? " ready" : ""}${noAnim ? " no-anim" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
      >
        {items.map(({ key, book }) => {
          const offset = key - pointer;
          const cls = posClass(offset);
          const onClick = () => {
            if (dragRef.current.moved) return; // 드래그였으면 클릭 무시
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
              <BookCover
                src={book.cover_path}
                alt={`${book.title} 표지`}
                sizes="(max-width: 760px) 60vw, 320px"
                draggable={false}
              />
            </article>
          );
        })}
      </div>

      <button className="cf-nav cf-next" type="button" aria-label="다음 책" onClick={goNext}>
        &#8250;
      </button>

      <div className="cf-caption">
        <div
          className="pill"
          role="button"
          tabIndex={0}
          aria-label={`${active.title} 펼치기`}
          onClick={() => openBook(active.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openBook(active.id);
            }
          }}
        >
          <span className="t">{active.title}</span>
          <span className="s">클릭하여 펼치기 · {mod(pointer, n) + 1} / {n}</span>
        </div>
      </div>

      <div
        className="cf-scroll"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={n}
        aria-valuenow={mod(pointer, n) + 1}
        aria-label="책 위치"
        onClick={(e) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
          const targetIdx = Math.min(n - 1, Math.floor(ratio * n));
          moveTo(n + targetIdx);
        }}
      >
        <div
          className="cf-scroll-thumb"
          style={{
            width: `${Math.max(10, 100 / n)}%`,
            left: `${(mod(pointer, n) / Math.max(1, n - 1)) * (100 - Math.max(10, 100 / n))}%`,
          }}
        />
      </div>
    </div>
  );
}
