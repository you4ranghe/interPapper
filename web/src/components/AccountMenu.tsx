"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminNotifications from "@/components/AdminNotifications";
import ProfileEditButton from "@/components/ProfileEditButton";
import LogoutButton from "@/components/LogoutButton";
import { GREETINGS } from "@/lib/greetings";

type ProfileLite = {
  id: string;
  name: string | null;
  email: string | null;
  address: string | null;
  gender: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function AccountMenu({
  isAdmin,
  profile,
  greetIndex,
}: {
  isAdmin: boolean;
  profile: ProfileLite;
  // 방문마다 다른 인사말 — 서버(force-dynamic)에서 무작위로 골라 넘겨
  // 하이드레이션 불일치 없이 매 로드마다 바뀐다.
  greetIndex: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const greetIdx = ((greetIndex % GREETINGS.length) + GREETINGS.length) % GREETINGS.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const name = profile.name || profile.email || "회원";

  return (
    <div className={`acct-menu${open ? " open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="acct-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="계정 메뉴"
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="acct-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
        <span className="acct-greet">
          <span className="who">{name}</span>님<span className="acct-phrase">, {GREETINGS[greetIdx]}</span>
        </span>
        <svg className="acct-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* 패널은 항상 마운트하고 표시만 CSS로 토글한다 — 자식(알림/회원정보)이
          여는 모달은 document.body 로 포털되므로 메뉴를 닫아도 유지되고,
          알림 폴링도 백그라운드에서 계속 돈다. */}
      <div className="acct-panel" role="menu">
        <div className="acct-rows" onClick={() => setOpen(false)}>
          {isAdmin && (
            <Link className="acct-row" href="/admin" role="menuitem">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 7v14" />
                <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
              </svg>
              서재 관리페이지
            </Link>
          )}
          {isAdmin && <AdminNotifications />}
          <ProfileEditButton profile={profile} />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
