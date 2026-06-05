"use client";

import { useEffect, useRef, useState } from "react";

const CLAMP_LINES = 20;

export default function AuthorNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const bodyRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const check = () => {
      const node = bodyRef.current;
      if (!node) return;
      const cs = getComputedStyle(node);
      let lh = parseFloat(cs.lineHeight);
      if (Number.isNaN(lh)) lh = parseFloat(cs.fontSize) * 1.8;
      // max-height 클램프이므로 scrollHeight 는 항상 전체 콘텐츠 높이 → 펼침 상태와 무관하게 안정적.
      setOverflowing(node.scrollHeight > lh * CLAMP_LINES + 2);
    };
    check();
    const t = window.setTimeout(check, 120); // 폰트 로딩 후 재측정
    window.addEventListener("resize", check);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", check);
    };
  }, [text]);

  return (
    <blockquote className="author-note">
      <span className="label">저자의 글</span>
      <span
        ref={bodyRef}
        className={`author-note-body${overflowing && !expanded ? " clamped" : ""}`}
      >
        {text}
      </span>
      {overflowing && (
        <button
          type="button"
          className="author-note-more"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "접기" : "··· 더보기"}
        </button>
      )}
    </blockquote>
  );
}
