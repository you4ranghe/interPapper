"use client";

import { useEffect, useState } from "react";
import { smoothScrollToElement } from "@/lib/smoothScroll";

// 우측 하단 고정 플로팅 Top 버튼. 스크롤이 threshold 이상 내려가면 fade-in.
export default function ScrollToTop({ threshold = 400 }: { threshold?: number }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const handleClick = () => {
    const el = document.getElementById("top");
    if (el) smoothScrollToElement(el, 700);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className={`to-top-fab${show ? " show" : ""}`}
      onClick={handleClick}
      aria-label="상단으로 이동"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
    >
      <span className="arrow" aria-hidden>↑</span>
      <span className="cap">TOP</span>
    </button>
  );
}
