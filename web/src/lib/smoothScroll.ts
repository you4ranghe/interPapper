// 페이지 스크롤을 시간/이징으로 직접 제어. 브라우저 native smooth 보다 살짝 느리고 차분하게.
// prefers-reduced-motion 설정 시에는 즉시 이동.

// 시작은 즉각적이고 끝에서 부드럽게 감속 — 클릭과 동시에 빠르게 움직이는 느낌
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function smoothScrollTo(targetY: number, duration = 700): void {
  if (typeof window === "undefined") return;
  const startY = window.scrollY;
  const dy = targetY - startY;
  if (Math.abs(dy) < 1) return;
  if (reducedMotion()) {
    window.scrollTo(0, targetY);
    return;
  }
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration);
    window.scrollTo(0, Math.round(startY + dy * easeOutCubic(t)));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function smoothScrollToElement(el: HTMLElement | null, duration = 700, offset = 0): void {
  if (!el || typeof window === "undefined") return;
  const rect = el.getBoundingClientRect();
  smoothScrollTo(window.scrollY + rect.top + offset, duration);
}
