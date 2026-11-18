# 화면 캡처

[디자인 가이드](../README.md)의 화면 참조에서 연결하는 참고 이미지입니다. 2026-11-18에 찍었고 픽셀 비교 기준(baseline)이나 시각 승인 기록이 아닙니다.

## 조건

- 앱: `main` @ `6bc5ea2`와 같은 코드(문서 PR #36 브랜치). 개발 서버, 데스크톱 Chromium, 기본 글자 크기(100%)입니다.
- 폭: 모바일 390px, 데스크톱 1440px. 파일명 끝의 숫자가 폭입니다.
- 이름: `{화면}-{테마}-{폭}.png`. 테마가 없는 화면은 테마 자리를 생략합니다.
- 공개 화면(`/sample`)은 세 테마, 접힌 폼의 기본 상태입니다.
- 관리자·온보딩은 E2E fixture가 만든 임시 계정과 임시 데이터입니다. 화면의 이름·금액은 예시입니다.
- 날짜가 들어가는 값(샘플의 생일 D-day 배지 등)은 촬영일 그대로이고 고정하지 않았습니다.

## 파일

- `public-{pixel_y2k,mono_bw,soft_pastel}-{390,1440}.png`: `/sample` 전체 화면
- `home-{390,1440}.png`: `/` 전체 화면
- `onboarding-390.png`: `/onboarding` 첫 화면
- `admin-home-1440.png`, `admin-wishes-1440.png`, `admin-messages-1440.png`, `admin-settings-1440.png`: 관리자 첫 화면
- `admin-messages-390.png`: 모바일 메시지함 첫 화면
- `admin-share-result-1440.png`: 관리자 홈에서 `공유하기`를 누른 직후

글자 크기를 키운 화면은 담지 않았습니다. 그 확인은 [기초 규칙](../foundations.md)의 320px 100·150·200% 기준을 따릅니다.
