"use client";

import { useState } from "react";

type Props = {
  src?: string | null;
  name?: string | null;
  /** 지름(px) — 기본 40 (유튜브 댓글과 유사) */
  size?: number;
  className?: string;
};

/**
 * 원형 프로필 아바타.
 * 등록된 이미지가 있으면 표지 이미지처럼 원형으로 채우고,
 * 없거나 로드에 실패하면 사람 프로필 아이콘으로 대체한다. (유튜브 댓글 스타일)
 */
export default function Avatar({ src, name, size = 40, className }: Props) {
  const [broken, setBroken] = useState(false);
  const showImg = Boolean(src) && !broken;

  return (
    <span
      className={`avatar${showImg ? " has-img" : ""}${className ? ` ${className}` : ""}`}
      style={{ width: size, height: size }}
      aria-hidden={name ? undefined : true}
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={name ? `${name} 프로필 이미지` : "프로필 이미지"}
          onError={() => setBroken(true)}
          loading="lazy"
          draggable={false}
        />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </span>
  );
}
