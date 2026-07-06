# 소셜 로그인(구글) 설정 가이드

Interpaper 구글 로그인을 켜려면 **콘솔 2곳**(Google Cloud Console, Supabase)에서 설정이 필요합니다.
코드는 이미 다 붙어 있고, 아래는 "대시보드에서 클릭할 것들"만 정리한 것입니다.

- Supabase 프로젝트 ref: `ttsnnuvqpgdwejxurcih`
- Supabase 대시보드: https://supabase.com/dashboard/project/ttsnnuvqpgdwejxurcih

---

## 0. 먼저 개념 — 왜 콜백 URL이 2종류인가

로그인 버튼을 누르면 이렇게 흘러갑니다:

```
[Google로 계속하기] 클릭
  → 구글 로그인 화면
  → (A) Supabase 콜백으로 복귀   https://ttsnnuvqpgdwejxurcih.supabase.co/auth/v1/callback
  → Supabase 가 세션 발급
  → (B) 우리 앱 콜백으로 복귀     http://localhost:3000/auth/callback
  → /library 로 이동 (로그인 완료)
```

그래서 등록할 URL이 두 개입니다. **헷갈리면 안 됩니다.**

| 구분 | 값 | 어디에 등록? |
|---|---|---|
| **(A) Supabase 콜백** | `https://ttsnnuvqpgdwejxurcih.supabase.co/auth/v1/callback` | **구글** 콘솔의 "리디렉션 URI" |
| **(B) 앱 콜백** | `http://localhost:3000/**` (+배포도메인) | **Supabase** 대시보드의 "Redirect URLs" |

---

## 1. DB 마이그레이션 실행 (1분)

1. https://supabase.com/dashboard/project/ttsnnuvqpgdwejxurcih 접속
2. 왼쪽 메뉴 **SQL Editor** → **New query**
3. `web/supabase/migrations/0007_oauth_profile.sql` 내용을 전부 복사해 붙여넣기
4. 오른쪽 아래 **Run** (또는 Ctrl+Enter)
5. "Success" 나오면 끝. (소셜 가입자도 프로필·프로필사진이 자동 생성되도록 하는 트리거입니다)

---

## 2. Supabase — 앱 콜백 URL 등록 (필수)

1. 대시보드 왼쪽 **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:3000` 입력 (배포 후엔 실제 도메인으로 변경)
3. **Redirect URLs** → **Add URL** 눌러서 아래 추가:
   - `http://localhost:3000/**`
   - (배포 후) `https://내도메인.com/**`
   - `**` 는 하위 경로 전체 허용이라 `/auth/callback` 이 포함됩니다.
4. **Save**

> 이걸 안 하면 로그인 후 "requested path is invalid" 에러로 되돌아옵니다.

---

## 3. 구글 설정 (상세)

### 3-1. 프로젝트 만들기
1. https://console.cloud.google.com 접속 (구글 계정 로그인)
2. 상단 파란 바 왼쪽의 **프로젝트 선택** 드롭다운 → **새 프로젝트**
3. 프로젝트 이름 `interpaper` → **만들기** → 생성되면 그 프로젝트로 전환

### 3-2. OAuth 동의 화면 (앱 등록)
1. 왼쪽 메뉴(☰) → **API 및 서비스** → **OAuth 동의 화면**
   - (최신 콘솔은 **Google Auth Platform → 브랜딩** 으로 표시될 수 있습니다)
2. **User Type: 외부(External)** 선택 → **만들기**
3. 앱 정보 입력:
   - 앱 이름: `Interpaper`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. **범위(Scopes)**: 아무것도 추가 안 해도 됩니다 (email·profile 기본 포함) → 다음
5. **테스트 사용자(Test users)**: **+ADD USERS** 로 로그인 테스트할 이메일(예: `you4ranghe@gmail.com`) 추가
   - ⚠️ 게시 상태가 "테스트"면 여기 등록된 계정만 로그인 됩니다. 나중에 **APP 게시(프로덕션 전환)** 하면 아무나 로그인 가능.
6. 저장

### 3-3. 사용자 인증 정보(클라이언트 ID) 발급
1. 왼쪽 **API 및 서비스** → **사용자 인증 정보(Credentials)**
2. 상단 **+ 사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
3. **애플리케이션 유형: 웹 애플리케이션**
4. 이름: `interpaper-web`
5. **승인된 리디렉션 URI(Authorized redirect URIs)** → **+ URI 추가** →
   ```
   https://ttsnnuvqpgdwejxurcih.supabase.co/auth/v1/callback
   ```
   ← 이 값(A)을 **오타 없이** 그대로. 끝에 슬래시(/) 붙이지 마세요.
   - (승인된 자바스크립트 원본은 비워도 됩니다)
6. **만들기** → 팝업에 뜨는 **클라이언트 ID** 와 **클라이언트 보안 비밀번호(Client Secret)** 복사

### 3-4. Supabase 에 입력
1. Supabase 대시보드 → **Authentication** → **Providers** (또는 Sign In / Providers) → 목록에서 **Google**
2. **Enable Sign in with Google** 켜기
3. **Client IDs**: 방금 복사한 클라이언트 ID 붙여넣기
4. **Client Secret**: 클라이언트 보안 비밀번호 붙여넣기
5. **Save**
   - 이 화면에 있는 "Callback URL (for OAuth)" 값이 곧 (A)입니다. 3-3에서 넣은 값과 같은지 확인.

✅ 구글 끝.

---

## 4. 테스트

1. 로컬 서버 실행: `cd web && npm run dev`
2. http://localhost:3000/login 접속
3. **Google로 계속하기** → 구글 동의 → `/library` 로 돌아오면 성공
4. 우상단 계정 메뉴(⚙️)에 이름이 뜨는지 확인. (`you4ranghe@gmail.com` 으로 로그인하면 자동 관리자)

---

## 5. Vercel 배포 시 추가로 할 것

- **Supabase → URL Configuration**: Site URL 을 배포 도메인으로, Redirect URLs 에 `https://내도메인.com/**` 추가
- **구글 콘솔**: 리디렉션 URI는 (A) 그대로면 됨(변경 없음). 다만 아무나 로그인시키려면 OAuth 동의 화면을 **게시(프로덕션)** 로 전환

---

## 6. 자주 나는 에러

| 증상 | 원인/해결 |
|---|---|
| 구글 `redirect_uri_mismatch` | 구글 콘솔 리디렉션 URI가 (A)와 정확히 일치해야. 끝 슬래시·http/https·오타 확인 |
| 로그인 후 `requested path is invalid` | Supabase **Redirect URLs**(B) 미등록. 2번 단계 확인 |
| 구글 "액세스 차단됨: 앱이 테스트 중" | OAuth 동의 화면 테스트 사용자에 그 계정 미등록, 또는 프로덕션 미게시 |
| 로그인은 되는데 이름이 비어 있음 | 드물게 구글이 name 을 안 준 경우. 계정 메뉴 → 회원정보 수정에서 직접 입력 가능 |
