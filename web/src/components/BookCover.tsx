import Image from "next/image";

const FALLBACK = "/covers/book1.svg";

type Props = {
  src: string | null;
  alt: string;
  /** 뷰포트별 실제 렌더 폭 힌트 — srcset에서 알맞은 크기를 고르게 한다 */
  sizes: string;
  priority?: boolean;
  draggable?: boolean;
};

/**
 * 책 표지 공용 이미지 — next/image 로 WebP/AVIF 변환 + 리사이즈 + lazy loading.
 * width/height 는 자리 확보용 비율(3:4)이고 실제 크기는 기존 CSS(object-fit 등)가 결정한다.
 */
export default function BookCover({ src, alt, sizes, priority = false, draggable }: Props) {
  const url = src || FALLBACK;
  return (
    <Image
      src={url}
      alt={alt}
      width={600}
      height={800}
      sizes={sizes}
      priority={priority}
      draggable={draggable}
      // SVG(기본 표지 등)는 이미지 옵티마이저가 처리하지 않으므로 원본 그대로 사용
      unoptimized={url.endsWith(".svg")}
    />
  );
}
