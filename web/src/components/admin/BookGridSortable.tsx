"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@/lib/types";
import { reorderBooks } from "@/app/admin/actions";

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

  // 핸들러에서 항상 최신 순서를 읽기 위한 ref
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const savedKeyRef = useRef<string>("");

  // 서버에서 새 목록이 내려오면 동기화
  useEffect(() => {
    setItems(books);
    savedKeyRef.current = books.map((b) => b.id).join(",");
  }, [books]);

  const navigate = (id: number) => router.push(`/admin/books/${id}`);

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.cover_path ?? "/covers/book1.svg"} alt={b.title} draggable={false} />
              </div>
              <div className="bc-meta">
                <div className="bc-title">{b.title}</div>
                <div className="bc-sub">
                  {b.book_type ?? "-"}
                  {b.published_year ? ` · ${b.published_year}` : ""}
                </div>
                <div className="bc-badges">
                  {!b.is_published && <span className="bc-badge unpub">미출간</span>}
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
