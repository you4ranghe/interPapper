"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function Landing() {
  // 세 개의 영상을 이어붙여 끊김 없이 순환 재생.
  // video 두 개를 더블 버퍼로 써서, 재생 중인 클립이 끝나기 직전 다음 클립을 페이드인해 이음새를 감춘다.
  // 영상 3개(각 ~10초)에는 숲속 백색소음 오디오가 담겨 있어, 한 바퀴(약 30초) 동안 소리가 함께 흐른다.
  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true); // 기본은 음소거, 스피커 아이콘으로 토글

  // 음소거 상태를 두 video 엘리먼트에 동기화.
  // (muted 는 React 속성보다 DOM 프로퍼티로 직접 제어하는 편이 안정적)
  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (a) a.muted = muted;
    if (b) b.muted = muted;
  }, [muted]);

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    const PLAYLIST = [
      "/index_video_01.mp4",
      "/index_video_02.mp4",
      "/index_video_03.mp4",
    ];
    const FADE = 0.8; // 끝나기 0.8초 전부터 크로스페이드 시작 (CSS transition 0.7s 보다 약간 길게)
    const CROSSFADE_MS = 800;

    let current = a; // 현재 화면에 보이는 video
    let standby = b; // 다음 클립을 미리 버퍼링해 둔 video
    let curIdx = 0;
    let switching = false;

    function preload(video: HTMLVideoElement, idx: number) {
      video.src = PLAYLIST[idx];
      video.load();
    }

    // 초기화: current 는 0번 클립 재생, standby 에는 다음 클립 미리 로드
    current.classList.add("is-on");
    standby.classList.remove("is-on");
    current.play().catch(() => {});
    preload(standby, (curIdx + 1) % PLAYLIST.length);

    function handleTimeUpdate(e: Event) {
      const target = e.currentTarget as HTMLVideoElement;
      if (target !== current || switching) return;
      const dur = target.duration;
      if (!dur || !isFinite(dur)) return;
      if (dur - target.currentTime > FADE) return;

      switching = true;
      const nextIdx = (curIdx + 1) % PLAYLIST.length;

      standby.currentTime = 0;
      standby.play().catch(() => {});
      standby.classList.add("is-on");
      current.classList.remove("is-on");

      const outgoing = current;
      current = standby;
      standby = outgoing;
      curIdx = nextIdx;

      // 크로스페이드가 끝나면 빠진 영상은 정지시키고, 그 다음 클립을 미리 로드
      window.setTimeout(() => {
        outgoing.pause();
        preload(standby, (curIdx + 1) % PLAYLIST.length);
        switching = false;
      }, CROSSFADE_MS);
    }

    function handleEnded(e: Event) {
      // 안전장치: 전환 전에 현재 클립이 끝나버리면 검은 화면 대신 다시 재생
      const target = e.currentTarget as HTMLVideoElement;
      if (target === current) {
        target.currentTime = 0;
        target.play().catch(() => {});
      }
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
        src="/index_video_01.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <video
        ref={bRef}
        className="landing-video"
        src="/index_video_02.mp4"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <div className="landing-veil" aria-hidden="true" />

      <button
        type="button"
        className="landing-sound"
        onClick={() => setMuted((m) => !m)}
        aria-pressed={!muted}
        aria-label={muted ? "숲속 소리 켜기" : "숲속 소리 끄기"}
        title={muted ? "숲속 소리 켜기" : "숲속 소리 끄기"}
      >
        {muted ? (
          // 음소거 아이콘 (디폴트)
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M11 5 6 9H3v6h3l5 4V5Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          // 소리 켜짐 아이콘
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M11 5 6 9H3v6h3l5 4V5Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M16 9a4 4 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
      </button>

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
