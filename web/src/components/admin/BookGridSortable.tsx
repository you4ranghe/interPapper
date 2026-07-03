"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BookCover from "@/components/BookCover";
import type { Book } from "@/lib/types";
import { reorderBooks, setBookPublished } from "@/app/admin/actions";

type Props = {
  books: Book[];
  /** 현재 페이지의 절대 시작 위치(= offset). 페이지별 sort_order 보정에 사용. */
  startIndex: number;
  /** 필터/검색 중이면 부분집합이라 순서 변경을 막는다. */
  reorderable: boolean;
};

export default function BookGridSortable({ books, startIndex, reorderable }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Book[]>(books);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // 핸들러에서 항상 최신 순서를 읽기 위한 ref — 렌더 후 effect 에서 동기화
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const savedKeyRef = useRef<string>(books.map((b) => b.id).join(","));

  // 서버에서 새 목록이 내려오면 동기화 — 렌더 중 조건부 setState(React 권장 'props 로부터 상태 조정' 패턴)
  const [syncedBooks, setSyncedBooks] = useState(books);
  if (syncedBooks !== books) {
    setSyncedBooks(books);
    setItems(books);
  }
  useEffect(() => {
    savedKeyRef.current = books.map((b) => b.id).join(",");
  }, [books]);

  const navigate = (id: number) => router.push(`/admin/books/${id}`);

  // 카드 스위치: 서재 노출/숨김을 즉시 반영(낙관적 업데이트 → 서버 확정).
  const togglePublish = async (e: React.MouseEvent, b: Book) => {
    e.preventDefault();
    e.stopPropagation();
    if (busyId != null) return;
    const next = !b.is_published;
    setBusyId(b.id);
    setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_published: next } : x)));
    const res = await setBookPublished(b.id, next);
    setBusyId(null);
    if (res.error) {
      setItems((prev) => prev.map((x) => (x.id === b.id ? { ...x, is_published: !next } : x)));
      alert("노출 상태 변경 실패: " + res.error);
      return;
    }
    router.refresh();
  };

  const persist = async (next: Book[]) => {
    const key = next.map((b) => b.id).join(",");
    if (key === savedKeyRef.current) return; // 변화 없음
    setSaving(true);
    const res = await reorderBooks(next.map((b) => b.id), startIndex);
    setSaving(false);
    if (res.error) {
      setItems(books); // 실패 시 원복
      alert("순서 저장 실패: " + res.error);
      return;
    }
    savedKeyRef.current = key;
    router.refresh();
  };

  const onDragStart = (i: number) => (e: React.DragEvent) => {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(items[i].id));
  };

  const onDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(i);
    if (dragIndex === null || dragIndex === i) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIndex(i);
  };

  const finishDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
    persist(itemsRef.current);
  };

  return (
    <>
      {reorderable ? (
        <p className="book-reorder-hint">
          <span className="ico" aria-hidden>⠿</span>
          카드를 끌어다 놓아 노출 순서를 바꿀 수 있어요. 이 순서가 서재에 그대로 보입니다.
          {saving && <span className="saving"> · 저장 중…</span>}
        </p>
      ) : (
        <p className="book-reorder-hint muted">검색·필터 중에는 순서를 변경할 수 없습니다.</p>
      )}

      <div className={`book-grid${reorderable ? " is-sortable" : ""}`}>
        {items.map((b, i) => {
          const order = reorderable ? startIndex + i + 1 : (b.sort_order ?? -1) + 1;
          return (
            <div
              key={b.id}
              className={
                "book-card" +
                (b.is_published ? "" : " is-hidden") +
                (dragIndex === i ? " is-dragging" : "") +
                (overIndex === i && dragIndex !== i ? " is-over" : "")
              }
              role="button"
              tabIndex={0}
              aria-label={`${b.title} 편집`}
              draggable={reorderable}
              onClick={() => navigate(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(b.id);
                }
              }}
              onDragStart={reorderable ? onDragStart(i) : undefined}
              onDragOver={reorderable ? onDragOver(i) : undefined}
              onDrop={reorderable ? (e) => { e.preventDefault(); finishDrag(); } : undefined}
              onDragEnd={reorderable ? finishDrag : undefined}
            >
              <div className="bc-cover">
                {order > 0 && (
                  <span className="bc-order" title="노출 순서">{order}</span>
                )}
                <button
                  type="button"
                  className={`bc-toggle${b.is_published ? " on" : ""}`}
                  role="switch"
                  aria-checked={b.is_published}
                  aria-label={b.is_published ? "서재에 노출 중 — 눌러서 숨김" : "서재에서 숨김 — 눌러서 노출"}
                  title={b.is_published ? "노출 중 · 눌러서 숨김" : "숨김 · 눌러서 노출"}
                  draggable={false}
                  disabled={busyId === b.id}
                  onClick={(e) => togglePublish(e, b)}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <span className="knob" aria-hidden />
                  <span className="lbl">{b.is_published ? "노출" : "숨김"}</span>
                </button>
                <BookCover src={b.cover_path} alt={b.title} sizes="200px" draggable={false} />
              </div>
              <div className="bc-meta">
                <div className="bc-title">{b.title}</div>
                <div className="bc-sub">
                  {b.book_type ?? "-"}
                  {b.published_year ? ` · ${b.published_year}` : ""}
                </div>
                <div className="bc-badges">
                  {!b.is_published && <span className="bc-badge unpub">숨김</span>}
                  {(b.purchase_links ?? []).map((l, li) => (
                    <a
                      key={li}
                      className="bc-link-btn"
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={l.url}
                      draggable={false}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {l.seller || "판매처"} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
