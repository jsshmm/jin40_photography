# 방명록 & 댓글 시스템 구현 계획

## 프로젝트 현황

- [x] **방명록 완료** - 2026-01-25
- [ ] **블로그 댓글** - post.html에 댓글 섹션 추가 필요

---

## 개요

GitHub Pages 정적 사이트에 계정 생성/로그인 없이 익명으로 사용할 수 있는 방명록과 블로그 댓글 시스템을 구축합니다.

## 추천 솔루션: Supabase

### 왜 Supabase인가?

| 요구사항 | Supabase |
|---------|----------|
| 로그인 없이 익명 댓글 | ✅ 지원 |
| 무료 사용 | ✅ 500MB 스토리지, 무제한 API |
| 서버 관리 불필요 | ✅ 완전 관리형 |
| 스팸 방지 | ✅ Rate limiting + Honeypot |
| 다국어 입력 | ✅ UTF-8 완벽 지원 |
| 관리 기능 | ✅ 웹 대시보드 제공 |

### 다른 옵션이 탈락한 이유

- **Giscus/Utterances**: GitHub 로그인 필요 (요구사항 위반)
- **Firebase**: 유사하게 좋지만 일일 read/write 제한 있음
- **Cusdis**: 무료 100개 제한, 이후 유료
- **Staticman**: 설정 복잡, 댓글 게시가 느림

---

## 구현 구조

### 데이터베이스 스키마

```sql
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_slug TEXT,                    -- NULL = 방명록, 값 있음 = 해당 포스트 댓글
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,             -- UTF-8: 모든 언어 입력 가능
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_approved BOOLEAN DEFAULT false, -- 관리자 승인 대기
  honeypot TEXT                      -- 스팸 방지용 (항상 빈 값)
);

-- 인덱스 생성
CREATE INDEX idx_comments_post_slug ON comments(post_slug);
CREATE INDEX idx_comments_approved ON comments(is_approved);
```

### Row Level Security (보안 정책)

```sql
-- 누구나 삽입 가능 (honeypot 비어있을 때만)
CREATE POLICY "Allow anonymous inserts" ON comments
  FOR INSERT WITH CHECK (
    honeypot IS NULL OR honeypot = ''
  );

-- 승인된 댓글만 공개
CREATE POLICY "Show approved comments" ON comments
  FOR SELECT USING (is_approved = true);
```

---

## 파일 변경 목록

| 파일 | 작업 | 상태 |
|-----|------|------|
| `js/comments.js` | **새로 생성** - 댓글 시스템 로직 | [ ] 미완료 |
| `guestbook.html` | **새로 생성** - 방명록 페이지 | [ ] 미완료 |
| `post.html` | **수정** - 댓글 섹션 추가 | [ ] 미완료 |
| `css/style.css` | **수정** - 댓글 관련 스타일 추가 | [ ] 미완료 |
| `index.html` | **수정** - 네비게이션에 방명록 링크 추가 | [ ] 미완료 |
| `blog.html` | **수정** - 네비게이션에 방명록 링크 추가 | [ ] 미완료 |
| `gallery.html` | **수정** - 네비게이션에 방명록 링크 추가 | [ ] 미완료 |

---

## 구현 단계

### 단계 1: Supabase 프로젝트 설정 (사용자 수동 작업)
- [ ] Supabase 계정 생성 (https://supabase.com)
- [ ] 새 프로젝트 생성
- [ ] SQL Editor에서 위 테이블 스키마 실행
- [ ] Table Settings에서 Row Level Security 활성화
- [ ] 위 보안 정책 SQL 실행
- [ ] Settings > API에서 Project URL과 anon key 복사

### 단계 2: 댓글 시스템 JavaScript 모듈 생성
- [ ] `js/comments.js` 파일 생성
- 기능:
  - Supabase REST API 연동
  - 댓글 로드/표시 기능
  - 댓글 제출 기능
  - Honeypot 스팸 방지
  - XSS 방지 (HTML escape)
  - 다국어 입력 지원 (UTF-8)

### 단계 3: 방명록 페이지 생성
- [ ] `guestbook.html` 파일 생성
- 기존 페이지 구조 따름 (navbar, footer)
- 댓글 폼 (이름, 메시지)
- 댓글 목록 표시

### 단계 4: 블로그 포스트에 댓글 섹션 추가
- [ ] `post.html` 수정
- Related Posts 섹션 아래에 댓글 섹션 추가
- 현재 포스트 slug를 댓글에 연결

### 단계 5: 스타일 추가
- [ ] `css/style.css` 수정
- 댓글 폼 스타일
- 댓글 카드 스타일
- 성공/에러 메시지 스타일

### 단계 6: 네비게이션 업데이트
- [ ] 모든 페이지 (index.html, blog.html, gallery.html, post.html, guestbook.html)에 방명록 링크 추가

---

## 코드 구현 세부사항

### js/comments.js 구조

```javascript
const CommentSystem = {
    supabaseUrl: 'YOUR_SUPABASE_URL',  // 사용자가 입력 필요
    supabaseKey: 'YOUR_ANON_KEY',      // 사용자가 입력 필요

    async init(postSlug = null) {
        // postSlug: null이면 방명록, 문자열이면 해당 포스트 댓글
        this.postSlug = postSlug;
        await this.loadComments();
        this.setupForm();
    },

    async loadComments() { /* 댓글 목록 로드 */ },
    renderComments(comments, container) { /* 댓글 렌더링 */ },
    setupForm() { /* 폼 이벤트 설정 */ },
    async submitComment(form) { /* 댓글 제출 */ },
    escapeHtml(text) { /* XSS 방지 */ },
    formatDate(dateStr) { /* 날짜 포맷 */ },
    showMessage(type) { /* 성공/에러 메시지 표시 */ }
};
```

### HTML 댓글 폼 구조

```html
<section class="comments-section" id="comments-section">
    <div class="container container-narrow">
        <h3>Comments</h3>

        <form id="comment-form" class="comment-form">
            <input type="text" name="name" placeholder="Your name" required>
            <textarea name="message" placeholder="Write your message here..." rows="4" required></textarea>
            <!-- Honeypot: hidden via CSS -->
            <input type="text" name="website" class="honeypot" tabindex="-1" autocomplete="off">
            <button type="submit" class="btn btn-primary">Submit</button>
        </form>
        <div id="comment-message"></div>

        <div id="comments-list" class="comments-list"></div>
    </div>
</section>
```

### CSS 스타일 (style.css에 추가)

```css
/* ===== Comments Section ===== */
.comments-section {
    padding: 60px 0;
    background: var(--bg-light);
}

.comments-section h3 {
    font-size: 1.8rem;
    margin-bottom: 30px;
    color: var(--primary-color);
}

.comment-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 40px;
}

.comment-form input,
.comment-form textarea {
    padding: 15px;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    font-family: var(--font-main);
    font-size: 1rem;
}

.comment-form textarea {
    resize: vertical;
    min-height: 100px;
}

.comment-form .honeypot {
    position: absolute;
    left: -9999px;
}

.comments-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.comment-item {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: var(--shadow);
}

.comment-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
}

.comment-author {
    font-weight: 600;
    color: var(--primary-color);
}

.comment-date {
    font-size: 0.85rem;
    color: var(--text-light);
}

.comment-message {
    line-height: 1.6;
    color: var(--text-color);
}

.no-comments {
    text-align: center;
    color: var(--text-light);
    padding: 40px;
}

.comment-message-success {
    color: #27ae60;
    padding: 15px;
    background: #e8f8e8;
    border-radius: 8px;
    margin-top: 10px;
}

.comment-message-error {
    color: #e74c3c;
    padding: 15px;
    background: #fde8e8;
    border-radius: 8px;
    margin-top: 10px;
}
```

---

## 관리 방식

1. **새 댓글**: `is_approved = false`로 저장됨
2. **관리자 확인**: Supabase 웹 대시보드 > Table Editor > comments
3. **승인**: `is_approved`를 `true`로 변경
4. **스팸 삭제**: 해당 row 삭제

---

## 검증 방법

1. [ ] 방명록 페이지에서 댓글 작성 테스트
2. [ ] Supabase 대시보드에서 댓글 확인
3. [ ] 댓글 승인 후 사이트에서 표시 확인
4. [ ] 블로그 포스트에서 댓글 작성 테스트
5. [ ] 다국어 입력 테스트 (한국어, 일본어, 이모지 등)
6. [ ] Honeypot 필드 채워서 스팸 차단 테스트

---

## 다음 세션에서 진행 방법

1. 이 문서를 읽고 현재 진행 상황 확인
2. 사용자에게 Supabase 설정 완료 여부 확인
3. 체크박스가 미완료인 단계부터 순차적으로 진행
4. 각 단계 완료 시 이 문서의 체크박스 업데이트
