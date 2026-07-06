// 계정 메뉴 인사말 — 클라이언트 컴포넌트(AccountMenu)와 서버 페이지(library) 양쪽에서
// 공유하려고 "use client" 밖의 일반 모듈에 둔다. 서버에서 인덱스를 골라 prop 으로 넘긴다.
export const GREETINGS = [
  "안녕하세요",
  "반갑습니다",
  "어서 오세요",
  "환영합니다",
  "좋은 하루예요",
  "오늘도 반가워요",
  "다시 만나 반가워요",
  "좋은 시간 보내세요",
  "편안한 하루 되세요",
  "오늘도 좋은 하루 되세요",
];

// 서버(force-dynamic) 렌더에서 매 요청마다 인사말 인덱스를 무작위로 고른다.
export function pickGreetIndex(): number {
  return Math.floor(Math.random() * GREETINGS.length);
}
