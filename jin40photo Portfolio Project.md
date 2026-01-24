---
date: 2026-12-31
tags:
  - photograph
---
## 프로젝트 개요
- 사진 포트폴리오 웹사이트
- 도메인: https://jin40photo.com
- 호스팅: GitHub Pages
- CDN: Cloudflare

## 프로젝트 구조
```
jin40photo/
├── index.html          # 홈페이지 (home.html로 리다이렉트)
├── home.html           # 메인 페이지
├── gallery.html        # 사진 갤러리
├── blog.html           # 블로그 목록
├── post.html           # 블로그 포스트 뷰어
├── css/style.css       # 스타일시트
├── js/
│   ├── main.js         # 메인 JavaScript
│   ├── gallery.js      # 갤러리 기능
│   └── blog.js         # 블로그 기능
├── images/
│   ├── gallery/        # 갤러리 사진
│   ├── blog/           # 블로그 전용 이미지
│   ├── hero/           # 히어로 이미지
│   └── new/            # 새 사진 업로드용 (임시)
├── posts/              # 블로그 포스트 (.md 파일)
├── data/
│   └── metadata.json   # 갤러리 메타데이터
├── scripts/            # 빌드 스크립트
├── sitemap.xml         # 사이트맵
├── robots.txt          # 검색엔진 크롤러 설정
└── .nojekyll           # Jekyll 비활성화
```

## 현재 진행 상황
- [x] GitHub Pages 배포 완료
- [x] 커스텀 도메인 연결 (jin40photo.com)
- [x] Cloudflare DNS 및 SSL 설정 (Full strict)
- [x] Open Graph 메타 태그 추가 (모든 페이지)
- [x] Google Analytics 설정 (G-XHMYGCR88L)
- [x] Google Search Console 등록 및 sitemap 제출
- [x] sitemap.xml 생성
- [x] robots.txt 추가
- [x] 블로그 시스템 구축 완료
- [x] SEO 최적화 완료 (2026-01-21)
  - [x] 블로그 포스트 자동 sitemap 생성
  - [x] 동적 메타 태그 (description, keywords, OG, Twitter Card)
  - [x] 구조화된 데이터 (JSON-LD BlogPosting)
  - [x] Canonical URL 설정
  - [x] 한국어 검색 최적화

---

## How to Upload Photos (갤러리에 사진 추가)

### Step 1: 새 사진을 임시 폴더에 넣기
```
images/new/ 폴더에 사진 파일 복사
```

### Step 2: 스크립트 실행
```bash
npm run add-photos
```

프롬프트에 응답:
- **Photo type**: [g]allery 또는 [b]log 선택
  - **Gallery (갤러리용)**: 국가, 연도 입력 → `images/gallery/`로 저장 및 메타데이터 생성
  - **Blog (블로그용)**: 폴더명 입력 (예: 2026-01-21) → `images/blog/2026-01-21/`로 저장

자동 처리 사항:
- 리사이즈 (최대 1600x1600)
- WebP 변환 (품질 82%)
- EXIF 회전 보정
- 원본 파일 삭제

### Step 3: 배포
```bash
./deploy.sh "Add new photos"
# 또는
npm run deploy-quick
```

---

## How to Write a Blog Post (블로그 포스트 작성)

### Step 1: 템플릿 복사
```bash
cp posts/_template.md posts/2026-01-20-my-post.md
```

### Step 2: 내용 작성
```markdown
---
title: 포스트 제목
date: 2026-01-20
category: Travel
thumbnail: images/gallery/2024-thailand/DSCF3656.webp
excerpt: 블로그 목록에 표시될 요약 문구
---

본문 내용 작성 (마크다운 형식)

![이미지 설명](images/gallery/2024-thailand/DSCF3671.webp)
```

### Step 3: 블로그 전용 이미지 추가 (선택)
```bash
# 블로그에서만 사용할 이미지는 다음 방법 중 하나 선택:

# 방법 1: add-photos 스크립트 사용 (자동 변환)
npm run add-photos
# 프롬프트: Photo type - [g]allery or [b]log? → "b" 입력
# 폴더명 입력: 2026-01-21 (또는 여행명)
# 결과: images/blog/2026-01-21/photo.webp

# 방법 2: 수동으로 이미지 배치
# images/blog/2026-01-21/ 폴더에 WebP 형식 이미지 복사
```

마크다운에서 이미지 참조:
```markdown
![사진 설명](images/blog/2026-01-21/photo.webp)

# 캡션 추가
<figure>
  <img src="images/blog/2026-01-21/photo.webp" alt="사진 설명">
  <figcaption>캡션 텍스트</figcaption>
</figure>
```

### Step 4: 빌드 (index.json + sitemap.xml 자동 생성)
```bash
npm run build-all
```
- `posts/index.json` 생성 (블로그 목록)
- `sitemap.xml` 업데이트 (구글 검색 최적화)

또는 개별 실행:
```bash
npm run build-blog      # index.json만
npm run build-sitemap   # sitemap.xml만
```

### Step 5: 배포
```bash
./deploy.sh "Add new blog post: 포스트 제목"
# 또는
npm run deploy
```

### Step 6: Google Search Console 색인 요청 (선택)
1. https://search.google.com/search-console 접속
2. 상단 검색창에 포스트 URL 입력:
   ```
   https://jin40photo.com/post.html?slug=파일명
   ```
3. **색인 생성 요청** 클릭

**참고:** 색인 요청하면 구글 검색에 1-3일 내 노출 가능

---

## How to Update Site (사이트 업데이트)

### 빠른 배포 방법

#### 방법 1: deploy.sh 스크립트 (추천)
```bash
./deploy.sh "변경 내용 설명"
```
- 한 명령어로 add, commit, push 수행
- 커밋 메시지를 자유롭게 지정 가능
- 예: `./deploy.sh "Add new blog post"`

#### 방법 2: npm run deploy
```bash
npm run deploy
```
- 자동으로 "Update site" 메시지로 커밋
- 가장 빠른 배포 방법

### 수동 방법
```bash
git add .
git commit -m "변경 내용 설명"
git push
```

---

## How to Run Local Development Server

```bash
npx live-server
```
- 브라우저에서 http://localhost:8080 접속
- 파일 변경 시 자동 새로고침

---

## Scripts Reference (스크립트 목록)

### 사진 관련
| Command | Script | Description |
|---------|--------|-------------|
| `npm run add-photos` | `scripts/add-photos.js` | 새 사진 추가 (리사이즈 + WebP 변환 + 메타데이터) |

### 블로그 및 SEO 관련
| Command | Script | Description |
|---------|--------|-------------|
| `npm run build-blog` | `scripts/build-blog.js` | 블로그 index.json 자동 생성 |
| `npm run build-sitemap` | `scripts/build-sitemap.js` | sitemap.xml 자동 생성 (SEO) |
| `npm run build-all` | - | blog + sitemap 한번에 빌드 |

### 배포 관련
| Command | Description |
|---------|-------------|
| `./deploy.sh "메시지"` | 한 명령어로 배포 (커밋 메시지 지정) |
| `npm run deploy` | "Update site" 메시지로 자동 배포 |

---

## SEO 최적화 (Search Engine Optimization)

### 구현된 SEO 기능

#### 1. 자동 Sitemap 생성
- 모든 블로그 포스트가 sitemap.xml에 자동 추가
- Google이 새 콘텐츠를 빠르게 발견 가능
- 명령어: `npm run build-sitemap`

#### 2. 동적 메타 태그
각 블로그 포스트마다 자동 생성:
- **SEO 메타 태그**: description, keywords
- **Open Graph**: Facebook, LinkedIn 등 소셜 미디어 공유
- **Twitter Card**: 트위터 공유 최적화
- **Canonical URL**: 중복 콘텐츠 방지

#### 3. 구조화된 데이터 (JSON-LD)
- Google의 리치 스니펫 지원
- BlogPosting 스키마 사용
- 검색 결과에 작성자, 날짜, 이미지 표시

#### 4. 한국어 검색 최적화
- `lang="ko"` 속성 설정
- 한국어 키워드 자동 포함
- 한글 검색어 최적화

### Google Search Console 활용

#### 새 포스트 색인 요청 방법
1. https://search.google.com/search-console 접속
2. 상단 검색창에 URL 입력
3. "색인 생성 요청" 클릭

#### Sitemap 제출 (최초 1회)
1. Google Search Console → Sitemaps
2. `sitemap.xml` 제출
3. 이후 자동으로 크롤링됨

### 검색 노출 예상 시간
- **Google 크롤링**: 1-3일
- **검색 결과 노출**: 1-7일
- **순위 상승**: 2-4주 (콘텐츠 품질에 따라)

---

## Related Documents
- `blogplan.md` - 블로그 시스템 상세 계획 및 진행 상황
- `posts/_template.md` - 블로그 포스트 템플릿
