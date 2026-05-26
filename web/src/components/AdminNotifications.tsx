"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getUnreadSnapshot, markCommentRead, markCommentsRead } from "@/app/actions/notifications";
import type { UnreadComment } from "@/lib/notifications";

const POLL_MS = 30_000;

function fmtRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Math.max(0, Date.now() - t);
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "방금 전";
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}일 전`;
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(iso));
  } catch { return iso; }
}

export default function AdminNotifications() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UnreadComment[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    const snap = await getUnreadSnapshot();
    if (!mountedRef.current) return;
    setItems(snap.items);
    setCount(snap.count);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    const id = window.setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mountedRef.current = false;
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handlePick(c: UnreadComment) {
    setLoading(true);
    await markCommentRead(c.id);
    setItems((prev) => prev.filter((x) => x.id !== c.id));
    setCount((n) => Math.max(0, n - 1));
    setOpen(false);
    setLoading(false);
    router.push(`/?bookId=${c.book_id}&discuss=1&hl=${c.id}#discussion`);
    router.refresh();
  }

  async function handleMarkAll() {
    if (items.length === 0) return;
    setLoading(true);
    const ids = items.map((x) => x.id);
    await markCommentsRead(ids);
    setItems([]);
    setCount(0);
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        className="bell-btn"
        aria-label={`알림 ${count}건`}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {count > 0 && <span className="bell-badge">{count > 99 ? "99+" : count}</span>}
      </button>

      {open && (
        <div className="notif-modal-root" role="dialog" aria-modal="true" aria-label="새 댓글 알림">
          <button type="button" className="notif-backdrop" aria-label="닫기" onClick={() => setOpen(false)} />
          <div className="notif-modal">
            <header className="notif-head">
              <div>
                <h3>새 댓글</h3>
                <p className="sub">{count > 0 ? `읽지 않은 댓글 ${count}건` : "모두 확인했어요"}</p>
              </div>
              <div className="notif-actions">
                <button
                  type="button"
                  className="notif-mark-all"
                  onClick={handleMarkAll}
                  disabled={loading || items.length === 0}
                >
                  모두 읽음
                </button>
                <button type="button" className="notif-close" aria-label="닫기" onClick={() => setOpen(false)}>
                  ×
                </button>
              </div>
            </header>

            <div className="notif-list">
              {items.length === 0 ? (
                <p className="notif-empty">새 댓글이 없습니다.</p>
              ) : (
                items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="notif-item"
                    onClick={() => handlePick(c)}
                    disabled={loading}
                  >
                    <div className="ni-row1">
                      <span className="ni-book">{c.book_title || "(제목 없음)"}</span>
                      <span className="ni-time">{fmtRelative(c.created_at)}</span>
                    </div>
                    <div className="ni-row2">
                      <span className="ni-author">{c.author_name}</span>
                      {c.parent_id && <span className="ni-tag">답글</span>}
                    </div>
                    <div className="ni-content">{c.content}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 4.5 1.5 6 2 6.5H4c.5-.5 2-2 2-6.5Z" />
      <path d="M10.5 18a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}
