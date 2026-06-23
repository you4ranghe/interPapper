"use client";

import { useRouter } from "next/navigation";

// 테이블 행 전체를 클릭/키보드로 눌러 상세로 이동시키는 래퍼(<tr>).
export default function ClickableRow({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <tr
      className={`row-link${className ? " " + className : ""}`}
      role="link"
      tabIndex={0}
      aria-label="상세 보기"
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(href);
        }
      }}
    >
      {children}
    </tr>
  );
}
