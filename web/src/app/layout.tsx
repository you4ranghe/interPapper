import type { Metadata } from "next";
import { Gowun_Batang } from "next/font/google";
import "./globals.css";

// 제목/디스플레이용 바탕체 — next/font 로 셀프호스팅(빌드 시 서브셋 다운로드, CLS 없음)
const gowunBatang = Gowun_Batang({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-gowun",
  display: "swap",
  preload: false, // 한글 글리프는 unicode-range 서브셋으로 필요한 조각만 로드
});

export const metadata: Metadata = {
  title: "Interpaper · 바우치 서재(書齋)",
  description: "저자의 저서를 LP/Coverflow 감성으로 만나는 서재. 책을 펼치면 저자와의 토론이 시작됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={gowunBatang.variable} suppressHydrationWarning>
      <head>
        {/* 테마 결정: ?theme= > localStorage > OS 설정. 첫 페인트 전에 실행되어 깜빡임 없음 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var q=new URLSearchParams(location.search).get("theme");var t=q||localStorage.getItem("theme");if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        {/* 본문용 Pretendard Variable — 동적 서브셋(사용 글자만 로드)이라 CDN 유지가 가장 가볍다 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
