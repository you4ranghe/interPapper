"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  name: string;
  initial?: number | null;
};

// 연도만 고르는 캘린더형 팝오버. 폼 제출은 hidden input(name)으로 연동.
export default function YearPicker({ name, initial }: Props) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const [value, setValue] = useState<number>(initial ?? currentYear);
  const [open, setOpen] = useState(false);
  // 12년 단위 블록의 시작 연도
  const [base, setBase] = useState<number>(() => {
    const v = initial ?? currentYear;
    return v - (((v % 12) + 12) % 12);
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const years = Array.from({ length: 12 }, (_, i) => base + i);

  return (
    <div className="year-picker" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        className="year-picker-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span>{value}년</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {open && (
        <div className="year-picker-pop" role="dialog" aria-label="연도 선택">
          <div className="year-picker-head">
            <button type="button" onClick={() => setBase((b) => b - 12)} aria-label="이전 연도">‹</button>
            <span>{base} – {base + 11}</span>
            <button type="button" onClick={() => setBase((b) => b + 12)} aria-label="다음 연도">›</button>
          </div>
          <div className="year-picker-grid">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                className={
                  "year-cell" +
                  (y === value ? " sel" : "") +
                  (y === currentYear ? " now" : "")
                }
                onClick={() => {
                  setValue(y);
                  setOpen(false);
                }}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
