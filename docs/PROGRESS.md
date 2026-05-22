# Interpaper — 진행 현황 및 계획

> **프로젝트:** 아버지를 위한 LP/Coverflow 스타일 감성 서재 (Vinyl/Coverflow-Style Library)
> **최종 업데이트:** 2026-05-22
> **전체 진척도:** ▓▓▓▓▓▓▓░░░ **약 70%** (1차 화면 UI + 핵심 백엔드 완료, 부가기능·운영화 남음)

---

## 1. 한 줄 요약
저자(아버님)의 저서를 **Coverflow Faded Slider**로 진열하고, 책을 클릭하면 아래로 부드럽게 스크롤되어
**책 소개 + 저자의 글 + 무한 계층 대댓글 토론장**이 펼쳐지는 Spring Boot + Thymeleaf 단일 페이지 웹앱.

---

## 2. 기술 스택 & 실행 환경

| 구분 | 내용 |
|------|------|
| 언어/런타임 | Java 17 (Temurin **17.0.19**, `./.toolchain/` 에 동봉) |
| 프레임워크 | Spring Boot **3.3.5**, Spring Data JPA, Thymeleaf, Validation |
| DB | H2 In-Memory (`create-drop`) |
| 빌드 | Gradle Wrapper **8.10.2** |
| 프론트 | Thymeleaf + Tailwind(Play CDN) + **jQuery 3.7.1** + 커스텀 CSS/JS |
| 타임존 | 전 구간 **Asia/Seoul** (JVM 기본 + Jackson `@JsonFormat`) |
| 포트 | **8081** (8080은 다른 프로세스가 점유) |

### 환경 이슈 메모 (중요)
- 로컬 기본 JDK는 11(플러그인 실행 불가), 별도 JDK 25는 Gradle 8.10이 못 읽음 → **JDK 17을 직접 받아 `./.toolchain/jdk-17.0.19+10` 에 두고 사용.**
- 정적 리소스/엔티티 변경은 **재빌드·재시작**해야 반영됨(devtools 미적용).

### 실행 방법
```bat
:: 프로젝트 루트의 run.bat 더블클릭 (또는)
.\run.bat
```
`run.bat` 이 ① 8081 포트 정리 → ② JDK17 지정 → ③ `gradlew bootRun` 까지 한 번에 수행.
기동 후 브라우저에서 **http://localhost:8081** + **Ctrl+Shift+R**.

---

## 3. 아키텍처 / 파일 구조
```
INTERPAPER/
├─ run.bat                         # 한 번에 빌드·실행
├─ build.gradle / settings.gradle / gradlew*
├─ .toolchain/                     # JDK17 (gitignore)
├─ docs/PROGRESS.md                # (본 문서)
└─ src/main/
   ├─ java/com/interpaper/library/
   │  ├─ InterpaperApplication.java        # 타임존 Asia/Seoul 고정
   │  ├─ domain/      Book, Comment(셀프참조 트리)
   │  ├─ repository/  BookRepository, CommentRepository(fetch join)
   │  ├─ dto/         BookSummaryResponse, BookDetailResponse, CommentResponse, CommentCreateRequest
   │  ├─ service/     BookService(트리 조립), CommentService
   │  ├─ controller/  PageController, BookApiController, CommentApiController, GlobalApiExceptionHandler
   │  └─ config/      DataInitializer(CommandLineRunner 시드)
   └─ resources/
      ├─ application.yml
      ├─ templates/index.html       # hero(coverflow) + 상세 + 토론 섹션
      └─ static/
         ├─ css/app.css             # coverflow/글래스/스크롤 UI
         ├─ js/app.js               # coverflow + 스크롤 상세/토론 (no-lambda)
         └─ images/                 # study-bg.jpg(실사진) + book{1,2,3}.svg
```

---

## 4. API 명세 (구현 완료)

| 메서드 | 경로 | 설명 | 상태 |
|--------|------|------|------|
| GET | `/api/books` | 캐러셀용 책 목록(요약) | ✅ |
| GET | `/api/books/{id}` | 책 상세 + 저자의 글 + 대댓글 트리 | ✅ |
| POST | `/api/comments` | 댓글/대댓글 등록(JSON, 검증) | ✅ |
| GET | `/` | 메인 페이지(Thymeleaf) | ✅ |

- 응답 시각은 `yyyy-MM-dd HH:mm:ss` (KST).
- 오류는 `GlobalApiExceptionHandler`가 JSON으로 통일 응답.

---

## 5. 완료된 작업 (Done)

### 백엔드
- [x] `Book` 엔티티 (title, introduction, **authorNote(저자의 글)**, imagePath, createdAt)
- [x] `Comment` 엔티티 — 셀프 참조(parent/children), 연관관계 편의 메서드, cascade/orphanRemoval
- [x] 무한 계층 대댓글 **트리 조립** (작성순 단일 패스, N+1 회피용 fetch join)
- [x] REST API 3종 + 페이지 컨트롤러
- [x] DTO 기반 직렬화(엔티티 순환 방지) + KST 포맷
- [x] 입력 검증(`@Valid`) 및 공통 예외 처리
- [x] `DataInitializer`(**CommandLineRunner**): 책 3권 + 부모-자식-손자(깊이3) 대댓글 + authorNote 시드
- [x] 타임존 Asia/Seoul 전역 적용
- [x] curl 스모크 테스트: 목록/상세/트리/POST(루트·대댓글) 정상 확인

### 프론트엔드
- [x] **Coverflow Faded Slider**: 무한 순환으로 항상 5권 노출(중앙 또렷 / ±1 scale .8 / ±2 scale .6 페이드)
- [x] 고급 **서재 실사진 배경** + 비네팅/앰비언트 글로우
- [x] 모던 비주얼: `-webkit-box-reflect` 반사, 활성 표지 글로우+플로팅, 글래스모피즘 캡션/내비, 도트 인디케이터, 스프링 이징, `clamp()` 유동 타이포
- [x] 조작: 클릭/방향키/도트 네비게이션
- [x] **클릭 → 아래 상세로 부드러운 스크롤** (모달 제거, 단일 페이지 흐름)
- [x] 상세: 표지 사진 + 제목 + 내용 소개 + **저자의 글(블록쿼트)**
- [x] **저자와의 토론**: 차분한 다크 라운지 톤의 대댓글 트리 + 답글 폼
- [x] **"저자의 다른 책 보기"** 사이드 버튼(스크롤 시 등장 → 맨 위로 복귀)
- [x] 자바스크립트 **화살표 함수 미사용**(명시적 function)

### 빌드/운영
- [x] Gradle Wrapper(8.10.2) 생성, JDK17 toolchain 구성
- [x] `run.bat` 원클릭 빌드·실행 스크립트 (ASCII/CRLF)
- [x] `.gitignore` (.toolchain/, build/, .gradle/)

---

## 6. 진행/검증 중 (In Progress)
- [ ] **스크롤형 상세/토론 UI 브라우저 최종 확인** — 코드 반영 완료, 사용자 화면 검수 진행 중
- [ ] 한글 댓글 입력 실사용 확인 (서버 UTF-8 정상, 브라우저 jQuery 경로 확인 필요)

---

## 7. 남은 과제 (To-Do / 다음 단계)

### 기능
- [ ] **표지 이미지 업로드**(Multipart) — 현재는 정적 SVG 플레이스홀더. 저장 경로/검증/썸네일.
- [ ] 책 등록·수정 관리 화면(저자/관리자용)
- [ ] 댓글 **수정/삭제**, 신고, 정렬(최신/오래된)
- [ ] 대댓글 **페이징/더보기**(댓글 많아질 때)
- [ ] 저자 표시(저자 배지)의 **인증/권한** 처리 (현재는 닉네임 문자열 비교)

### 데이터/운영
- [ ] In-Memory H2 → **영속 DB**(파일 H2 또는 MySQL/PostgreSQL) 전환 + 마이그레이션(Flyway)
- [ ] 환경별 설정 분리(`application-{dev,prod}.yml`)
- [ ] 패키징/배포(`bootJar`, 실행 스크립트 또는 컨테이너)

### 품질
- [ ] 테스트: 서비스(트리 조립)·컨트롤러(MockMvc) 단위/통합 테스트
- [ ] 접근성(ARIA, 포커스 트랩) 및 반응형 추가 점검
- [ ] 빌드 환경 정리: JDK17 정식 설치 시 `.toolchain` 의존 제거 검토
- [ ] (선택) Git 저장소 초기화 및 첫 커밋

---

## 8. 알려진 제약 / 메모
- H2 In-Memory라 **재시작 시 데이터 초기화**(시드만 재적재).
- 정적 파일 변경 후 **반드시 재시작**해야 반영(`run.bat` 재실행).
- 포트 8080 점유로 **8081 사용** 중 — 필요 시 `run.bat`/`--server.port` 조정.
- 디자인 원칙: 본 프로젝트는 **항상 최신 기술·UI/UX 트렌드** 유지(사용자 요청).
