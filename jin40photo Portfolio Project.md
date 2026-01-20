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
- index.html: 홈페이지
- gallery.html: 사진 갤러리
- blog.html: 블로그
- css/style.css: 스타일시트
- js/main.js: JavaScript
- images/: 사진 폴더

## 현재 진행 상황
- [x] GitHub Pages 배포 완료
- [x] 커스텀 도메인 연결 (jin40photo.com)
- [x] Cloudflare DNS 설정
- [x] Open Graph 메타 태그 추가 (모든 페이지)
- [x] Google Analytics 설정 (G-XHMYGCR88L)
- [x] sitemap.xml 생성
- [ ] SEO 최적화 (추가 작업)

## 다음 할 일
1. robots.txt 추가 (선택)
2. 구조화된 데이터(JSON-LD) 추가 (선택)
3. 페이지 속도 최적화

## How to Upload Pictures
```
cd /Users/YongjooJin/my-portfolio
npm run add-photos
```

## How to Update Site
```
cd /Users/YongjooJin/my-portfolio
git add .
git commit -m "변경 내용 설명"
git push
```
