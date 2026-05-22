# Interpaper — 개발 계획 (Next.js + Supabase + Vercel)

> **작성:** 2026-05-22
> **스택 전환:** Spring Boot 프로토타입 → **Next.js(App Router, TypeScript) + Tailwind + Supabase + Vercel**
> 기존 Spring Boot 구현은 디자인/기획 레퍼런스(특히 Coverflow UI)로 보존.

---

## 1. 왜 전환하는가
- **Vercel** 은 Java/Spring Boot를 호스팅하지 못함 → 프런트는 Next.js여야 함.
- **Supabase** 가 Postgres + **Auth(이메일 인증 내장)** + Storage + Row Level Security를 한 번에 제공 → 회원/이메일 인증/표지 업로드를 직접 구현하지 않고 표준 방식으로 해결.
- 사용자 원칙: 항상 **최신 기술·UI/UX** (Next.js + Supabase + Vercel는 현대 표준 조합).

---

## 2. 확정된 요구사항
- 운영 스택: **Next.js + Supabase + Vercel**
- 관리자 계정: **you4ranghe@gmail.com** (로그인 시 '서재관리' 버튼 → 어드민 대시보드)
- 댓글: **회원만** 작성, **이메일 인증 필수**, 작성자는 **회원 이름(성함)** 으로 표시
- 회원 정보: 이메일(인증), 성함, 주소, 성별, 자기소개
- 어드민 대시보드: '큰 책상이 놓인 서재' 분위기. 헤더 = **책관리 / 댓글관리 / 회원관리**
  - 책관리: 이미지 포함 리스트 + 검색필터(**연도 / 키워드 / 책타입**) + 상세
  - 댓글관리: 리스트 + 상세 + 검색필터 + **숨김처리**
  - 회원관리: 리스트 + 상세 + 검색필터

---

## 3. 목표 아키텍처
```
[브라우저] ──> Next.js (Vercel)
                ├─ App Router 페이지 (홈 Coverflow / 책 상세+토론 / 인증 / /admin)
                ├─ Supabase JS 클라이언트 (브라우저: anon key, RLS 적용)
                └─ Route Handler / Server Action (서버: service role 필요한 작업)
                       │
                       ▼
                 [Supabase]
                 ├─ Auth (이메일+비번, 이메일 확인 메일)
                 ├─ Postgres (profiles / books / comments) + RLS
                 └─ Storage (bucket: covers)
```

### 디렉토리(예정)
```
web/                      # Next.js 앱 (신규)
├─ app/
│  ├─ page.tsx            # 홈 (Coverflow)
│  ├─ books/[id]/page.tsx # 책 상세 + 토론
│  ├─ (auth)/login, signup, verify
│  └─ admin/
│     ├─ layout.tsx       # 큰 책상 배경 + 헤더 탭
│     ├─ books/           # 리스트/상세 + 필터
│     ├─ comments/        # 리스트/상세 + 필터 + 숨김
│     └─ members/         # 리스트/상세 + 필터
├─ components/            # Coverflow, CommentTree, DataTable, Filters ...
├─ lib/supabase/          # client.ts(브라우저), server.ts(서버), admin.ts(service role)
├─ supabase/
│  ├─ migrations/*.sql    # 스키마 + RLS + 트리거
│  └─ seed.sql            # 책 3권 등 시드
└─ .env.local            # NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE
legacy-springboot/        # 기존 Spring Boot 프로토타입 보관(이동 예정)
```

---

## 4. 데이터 모델 (Postgres / Supabase)

### profiles  (auth.users 1:1 확장)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid PK, FK→auth.users | |
| email | text | auth와 동기 |
| name | text | 성함, 댓글 표시명 |
| address | text | |
| gender | text | 'male'/'female'/'other'/'na' |
| bio | text | 자기소개 |
| role | text | 'admin' / 'member' (기본 member) |
| created_at | timestamptz | |
- 신규 가입 시 트리거로 profiles 자동 생성. you4ranghe@gmail.com 은 role='admin' 부여.

### books
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | bigint PK | |
| title | text | |
| introduction | text | 책 소개 |
| author_note | text | 저자의 글 |
| cover_path | text | Storage 경로/공개 URL |
| book_type | text | 책타입(에세이/산문/회고 …) — 필터용 |
| published_year | int | 연도 — 필터용 |
| created_at | timestamptz | |

### comments  (무한 계층 + 숨김)
| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | bigint PK | |
| book_id | bigint FK→books | |
| parent_id | bigint FK→comments null | 대댓글 |
| author_id | uuid FK→profiles | 작성자(회원) |
| content | text | |
| hidden | boolean default false | 어드민 숨김 |
| created_at | timestamptz | KST 표시는 프런트에서 |

### RLS 정책(요지)
- books: 누구나 SELECT. INSERT/UPDATE/DELETE = admin 만.
- comments: SELECT는 `hidden=false`(또는 admin). INSERT는 **이메일 인증된 회원**(auth.uid() = author_id). UPDATE(hidden) = admin.
- profiles: 본인 SELECT/UPDATE, admin은 전체. 회원관리 목록은 admin.
- Storage covers 버킷: 공개 읽기, 쓰기는 admin.

---

## 5. 인증 / 이메일 인증
- Supabase Auth (email+password). 가입 시 **확인 메일** 발송 → 링크 클릭으로 인증 완료(Supabase 호스티드가 메일 발송 담당, 별도 SMTP 불필요. 운영 시 커스텀 SMTP 연결 가능).
- 미인증 사용자는 로그인은 되나 **댓글 작성 차단**(RLS + UI 모두).
- 관리자 판별: profiles.role='admin' (you4ranghe@gmail.com).
- 로그인 시 헤더에 **'서재관리'** 버튼(admin만) → `/admin`.

---

## 6. 화면

### 프런트(공개)
- **홈**: Coverflow Faded Slider(기존 디자인 포팅 — box-reflect/글로우/글래스/도트). 클릭 → 책 상세.
- **책 상세 + 토론**: 표지 사진 + 소개 + 저자의 글 → 아래 '저자와의 토론'(대댓글 트리). 댓글 작성은 로그인+인증 필요(아니면 가입/로그인 유도).
- **인증**: 회원가입(이메일/비번/성함/주소/성별/자기소개), 로그인, 이메일 인증 안내/콜백.

### 어드민 `/admin` (관리자 전용)
- 분위기: **큰 책상이 놓인 서재** 배경(메인과 다른 톤), 헤더 탭 = 책관리/댓글관리/회원관리.
- 공통: 검색필터 바 + 이미지 포함 데이터 테이블/카드 리스트 + 상세 패널.
- **책관리**: 표지 썸네일 리스트, 필터(연도/키워드/책타입), 상세(수정/표지 교체/삭제).
- **댓글관리**: 리스트(책/작성자/내용/숨김여부), 필터(키워드/책/숨김상태), 상세, **숨김 토글**.
- **회원관리**: 리스트(이메일/성함/인증여부/가입일), 필터(키워드/성별/인증상태), 상세.

---

## 7. 단계별 진행 (Phasing)
1. **Phase 0 — 셋업**: Next.js+TS+Tailwind 스캐폴드(`web/`), Supabase 클라이언트, `.env.local`, 기존 Spring Boot `legacy-springboot/`로 이동.
2. **Phase 1 — DB/인증**: 마이그레이션 SQL(profiles/books/comments + RLS + 트리거), 시드, 회원가입/로그인/이메일 인증, admin 판별.
3. **Phase 2 — 홈 Coverflow**: 기존 디자인 React 컴포넌트로 포팅, books 데이터 연동.
4. **Phase 3 — 책 상세 + 토론**: 대댓글 트리, 회원 전용 작성(인증 게이트), 숨김 댓글 제외.
5. **Phase 4 — 어드민 대시보드**: 책/댓글/회원 관리(리스트·필터·상세), 표지 업로드(Storage), 댓글 숨김.
6. **Phase 5 — 배포**: Vercel 연결, 환경변수, Supabase 프로덕션 설정(리다이렉트 URL/메일 템플릿), 스모크 테스트.

---

## 8. 진행에 필요한 준비물 (사용자 제공)
- [ ] **Supabase 프로젝트** 생성 후: `Project URL`, `anon key`, `service_role key`
  - (또는) 로컬 개발: Supabase CLI + Docker 사용 동의
- [ ] **Vercel 계정** (배포 단계에서 GitHub 연동)
- [ ] 로컬 **Node.js 18+ / npm** 설치 여부 확인
- [ ] Git 저장소(권장: GitHub) — Vercel 배포 연동용

> 위 키가 준비되면 Phase 0~1부터 즉시 진행. 키 없이도 코드/스키마/UI 스캐폴딩은 선행 가능(`.env.local` 자리표시자 사용).

---

## 9. 메모
- 기존 Spring Boot 산출물(엔티티/REST/Coverflow CSS·JS)은 데이터 모델과 디자인 그대로 이식 가능 → 재사용으로 속도 확보.
- KST 시각 표시는 프런트(Intl/dayjs)에서 처리.
- UI/UX는 메인과 어드민 모두 '최신 트렌드' 유지(글래스모피즘/모션/반응형).
