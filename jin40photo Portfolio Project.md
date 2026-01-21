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
- [ ] SEO 최적화 (추가 작업)

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

## How to Resize Existing Images (기존 이미지 리사이즈)

```bash
npm run resize-images
```
- `images/gallery/` 내 모든 이미지를 최대 1600x1600으로 리사이즈
- 품질: 82%

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

### Step 4: 빌드 (index.json 자동 생성)
```bash
npm run build-blog
```

### Step 5: 배포
```bash
./deploy.sh "Add new blog post: 포스트 제목"
# 또는
npm run deploy-quick
```

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
- Git 에디터가 열려서 커밋 메시지 작성
- 상세한 커밋 메시지 작성 가능

#### 방법 3: npm run deploy-quick
```bash
npm run deploy-quick
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

### 사진 및 블로그 관련
| Command | Script | Description |
|---------|--------|-------------|
| `npm run add-photos` | `scripts/add-photos.js` | 새 사진 추가 (리사이즈 + 메타데이터) |
| `npm run resize-images` | `scripts/resize-images.js` | 기존 이미지 리사이즈 |
| `npm run build-blog` | `scripts/build-blog.js` | 블로그 index.json 자동 생성 |

### 배포 관련
| Command | Description |
|---------|-------------|
| `./deploy.sh "메시지"` | 한 명령어로 배포 (커밋 메시지 지정) |
| `npm run deploy` | 에디터로 커밋 메시지 작성 후 배포 |
| `npm run deploy-quick` | "Update site" 메시지로 자동 배포 |

---

## Related Documents
- `blogplan.md` - 블로그 시스템 상세 계획 및 진행 상황
- `posts/_template.md` - 블로그 포스트 템플릿
