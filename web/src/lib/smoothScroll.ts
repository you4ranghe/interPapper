// 페이지 스크롤을 시간/이징으로 직접 제어. 브라우저 native smooth 보다 살짝 느리고 차분하게.
// prefers-reduced-motion 설정 시에는 즉시 이동.

// 시작은 즉각적이고 끝에서 부드럽게 감속 — 클릭과 동시에 빠르게 움직이는 느낌
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// 진행 중인 스크롤 애니메이션 핸들. 새 스크롤이 시작되면 이전 것을 취소해
// 두 rAF 루프가 동시에 window.scrollTo 를 호출하며 부딪히는(버벅임) 상황을 막는다.
let activeRAF: number | null = null;
let detachUserScroll: (() => void) | null = null;

function stopActive(): void {
  if (activeRAF != null) {
    cancelAnimationFrame(activeRAF);
    activeRAF = null;
  }
  if (detachUserScroll) {
    detachUserScroll();
    detachUserScroll = null;
  }
}

export function smoothScrollTo(targetY: number, duration = 700): void {
  if (typeof window === "undefined") return;
  stopActive();

  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const endY = Math.max(0, Math.min(targetY, maxY));
  const startY = window.scrollY;
  const dy = endY - startY;
  if (Math.abs(dy) < 1) return;
  if (reducedMotion()) {
    window.scrollTo({ top: endY, behavior: "instant" as ScrollBehavior });
    return;
  }

  // 사용자가 직접 휠/터치로 스크롤하면 애니메이션을 멈춰 입력과 싸우지 않게 한다.
  const onUserScroll = () => stopActive();
  window.addEventListener("wheel", onUserScroll, { passive: true });
  window.addEventListener("touchstart", onUserScroll, { passive: true });
  detachUserScroll = () => {
    window.removeEventListener("wheel", onUserScroll);
    window.removeEventListener("touchstart", onUserScroll);
  };

  const start = performance.now();
  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration);
    // behavior:"instant" 로 프레임마다 '즉시' 이동 — CSS scroll-behavior:smooth 가
    // 매 프레임 네이티브 스무스 스크롤을 또 발동시켜 부딪히는(버벅임) 것을 끊는다.
    // ("auto" 는 사양상 CSS scroll-behavior 를 따르므로 여기선 충돌이 남는다.)
    window.scrollTo({ top: Math.round(startY + dy * easeOutCubic(t)), behavior: "instant" as ScrollBehavior });
    if (t < 1) {
      activeRAF = requestAnimationFrame(tick);
    } else {
      stopActive();
    }
  }
  activeRAF = requestAnimationFrame(tick);
}

// 등장 transform(translateY 등)의 영향을 받지 않는, 문서 기준 절대 Y 위치.
// getBoundingClientRect 는 진행 중인 transform 을 포함해 목표가 흔들리므로 offsetTop 누적을 쓴다.
function documentTop(el: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

export function smoothScrollToElement(el: HTMLElement | null, duration = 700, offset = 0): void {
  if (!el || typeof window === "undefined") return;
  smoothScrollTo(documentTop(el) + offset, duration);
}
