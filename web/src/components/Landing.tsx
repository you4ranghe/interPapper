"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Landing() {
  // 이중 video crossfade — 한쪽 끝나기 0.5초 전 반대쪽을 페이드인해서 이음새 감춤
  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);
  const activeRef = useRef<"a" | "b">("a");

  useEffect(() => {
    const a: HTMLVideoElement | null = aRef.current;
    const b: HTMLVideoElement | null = bRef.current;
    if (!a || !b) return;
    const vidA: HTMLVideoElement = a;
    const vidB: HTMLVideoElement = b;

    const FADE = 0.6; // 끝나기 0.6초 전부터 크로스페이드 시작

    vidA.classList.add("is-on");
    vidB.classList.remove("is-on");
    // 자동재생 정책: muted + playsInline
    vidA.play().catch(() => {});

    function handleTimeUpdate(e: Event) {
      const target = e.currentTarget as HTMLVideoElement;
      const other: HTMLVideoElement = target === vidA ? vidB : vidA;
      const dur = target.duration;
      if (!dur || !isFinite(dur)) return;
      const remaining = dur - target.currentTime;
      if (remaining <= FADE && other.paused) {
        other.currentTime = 0;
        other.play().catch(() => {});
        other.classList.add("is-on");
        target.classList.remove("is-on");
        activeRef.current = target === vidA ? "b" : "a";
      }
    }

    function handleEnded(e: Event) {
      const target = e.currentTarget as HTMLVideoElement;
      target.currentTime = 0;
      target.play().catch(() => {});
    }

    a.addEventListener("timeupdate", handleTimeUpdate);
    b.addEventListener("timeupdate", handleTimeUpdate);
    a.addEventListener("ended", handleEnded);
    b.addEventListener("ended", handleEnded);

    return () => {
      a.removeEventListener("timeupdate", handleTimeUpdate);
      b.removeEventListener("timeupdate", handleTimeUpdate);
      a.removeEventListener("ended", handleEnded);
      b.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <section className="landing-section">
      <video
        ref={aRef}
        className="landing-video is-on"
        src="/landing-hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <video
        ref={bRef}
        className="landing-video"
        src="/landing-hero.mp4"
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="landing-veil" aria-hidden="true" />

      <div className="landing-content">
        <header className="landing-head">
          <p className="landing-eyebrow">Interpaper · 저자의 서재</p>
          <h1 className="landing-title">
            <span className="title-ko">바우치 서재</span>
            <span className="title-han">書齋</span>
          </h1>
          <div className="landing-divider" aria-hidden="true" />
          <p className="landing-bio">
            현직 의료인으로, 구도자로 살아가고 있다. 저서로
            {" "}〈가시를 빼기 위한 가시 — 『비갸나 바이라바』〉
            {" "}〈수행경 — 『쉬바 수트라』〉
            {" "}〈스판다와 재인식의 — 『소와 참나 이야기』〉
            {" "}〈아는 자를 아는 일 — 『프라탸비갸 흐리다얌』〉
            {" "}〈참 나를 느끼는 — 『스판다 카리카』〉
            {" "}〈삼위일체경 — 『파라 트리쉬카』〉
            {" "}등이 있다.
          </p>
        </header>

        <Link href="/library" className="landing-cta" aria-label="서재 둘러보기">
          <span className="cta-label">서재 둘러보기</span>
          <span className="cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
