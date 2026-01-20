# Blog System Plan

## Current Status (2026-01-20)

### Existing Structure
```
posts/
├── index.json          # 포스트 목록 (현재 비어있음 [])
├── 2024-03-15-golden-hour.md
├── 2024-03-10-lens-guide.md
└── 2024-03-05-kyoto-trip.md
```

### How It Currently Works
1. `blog.js`가 `posts/index.json`을 fetch하여 블로그 목록 표시
2. 개별 포스트는 `post.html?slug=파일명`으로 접근
3. 마크다운 파싱: `marked.js` 사용
4. Frontmatter 지원: title, date, category, thumbnail, excerpt

### Current Issues
- **index.json이 비어있음** → 블로그에 아무 포스트도 표시되지 않음
- **수동 업데이트 필요** → .md 파일 추가 시 index.json을 직접 수정해야 함

---

## Goal
마크다운 파일(.md)을 `posts/` 폴더에 넣으면 **자동으로** 블로그에 업로드되는 시스템

---

## Implementation Plan

### Phase 1: Fix Current System
- [ ] 1.1 기존 .md 파일들의 정보로 index.json 업데이트
- [ ] 1.2 블로그 페이지 정상 작동 확인

### Phase 2: Build Script for Auto-generation
- [ ] 2.1 `posts/` 폴더의 .md 파일을 스캔하는 Node.js 스크립트 생성
- [ ] 2.2 각 .md 파일의 frontmatter를 파싱하여 index.json 자동 생성
- [ ] 2.3 package.json에 빌드 명령어 추가 (`npm run build-blog`)

### Phase 3: Workflow Optimization
- [ ] 3.1 새 포스트 작성 가이드 문서화
- [ ] 3.2 (선택) GitHub Actions로 push 시 자동 빌드

---

## Markdown Post Format
```markdown
---
title: 포스트 제목
date: 2026-01-20
category: Category Name
thumbnail: images/blog/thumbnail.webp
excerpt: 포스트 요약 (목록에 표시됨)
---

본문 내용 (마크다운 형식)

![이미지 설명](images/blog/image.webp)
```

---

## Progress Log

| Date | Task | Status |
|------|------|--------|
| 2026-01-20 | 현재 구조 분석 | ✅ Done |
| | Phase 1 시작 | ⏳ In Progress |

---

## Notes
- 이미지는 `images/blog/` 폴더에 저장 권장
- 파일명 형식: `YYYY-MM-DD-slug-name.md`
- GitHub Pages는 정적 호스팅이므로 서버사이드 자동화 불가 → 빌드 스크립트 필요
