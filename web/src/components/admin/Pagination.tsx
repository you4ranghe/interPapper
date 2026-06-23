import Link from "next/link";

type Props = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  params: Record<string, string | undefined>;
};

function buildHref(basePath: string, params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && v.length > 0) sp.set(k, v);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({ basePath, page, pageSize, total, params }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // 1페이지여도 현재 페이지(1)를 표기한다. (전체 0건은 목록 분기에서 렌더 안 됨)

  const cur = Math.min(Math.max(1, page), totalPages);
  const window = 2;
  const start = Math.max(1, cur - window);
  const end = Math.min(totalPages, cur + window);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  const prev = cur > 1 ? cur - 1 : null;
  const next = cur < totalPages ? cur + 1 : null;

  return (
    <nav className="admin-pagination" aria-label="페이지 이동">
      <Link
        className={`pg-btn nav${prev ? "" : " is-disabled"}`}
        href={prev ? buildHref(basePath, params, prev) : "#"}
        aria-disabled={!prev}
        tabIndex={prev ? 0 : -1}
      >
        ‹ 이전
      </Link>

      {start > 1 && (
        <>
          <Link className="pg-btn" href={buildHref(basePath, params, 1)}>1</Link>
          {start > 2 && <span className="pg-ellipsis">…</span>}
        </>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          className={`pg-btn${p === cur ? " is-active" : ""}`}
          href={buildHref(basePath, params, p)}
          aria-current={p === cur ? "page" : undefined}
        >
          {p}
        </Link>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="pg-ellipsis">…</span>}
          <Link className="pg-btn" href={buildHref(basePath, params, totalPages)}>{totalPages}</Link>
        </>
      )}

      <Link
        className={`pg-btn nav${next ? "" : " is-disabled"}`}
        href={next ? buildHref(basePath, params, next) : "#"}
        aria-disabled={!next}
        tabIndex={next ? 0 : -1}
      >
        다음 ›
      </Link>
    </nav>
  );
}
