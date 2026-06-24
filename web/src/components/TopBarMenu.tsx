"use client";

import { useEffect, useState } from "react";

// 데스크톱: 자식(액션 버튼들)을 그대로 인라인 노출(display:contents).
// 모바일: 햄버거 버튼으로 접고, 토글 시 드롭다운으로 펼침 → 헤더 타이틀과 겹침 방지.
export default function TopBarMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={`topbar-menu${open ? " open" : ""}`}>
      <button
        type="button"
        className="topbar-burger"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bar" /><span className="bar" /><span className="bar" />
      </button>
      {open && <button type="button" className="topbar-scrim" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />}
      <div className="topbar-items" onClick={() => setOpen(false)}>
        {children}
      </div>
    </div>
  );
}
