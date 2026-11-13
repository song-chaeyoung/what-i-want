# 토큰과 컴포넌트 사용 기준

코드 대조일: 2026-10-30
토큰 이전 추가 대조일: 2026-11-10. 색 토큰 소유, 카드 제목, 타이포·모서리·테두리·그림자·반복 간격의 의미 이름만 다시 봤고, 나머지 컴포넌트 지도는 2026-10-30 정적 대조입니다.

[디자인 가이드](README.md)에서 영역을 고른 뒤 이 문서를 읽습니다. 실제 값·variant·props는 링크된 코드가 원본이며, 여기에는 역할과 선택 기준을 기록합니다. 문서의 예시 역할이 새로운 토큰의 생성을 뜻하지 않습니다.

## 토큰의 소유 범위

| 원본 | 담당 범위 | 사용할 때 |
| --- | --- | --- |
| [globals.css](../../app/globals.css)의 의미 토큰과 `--brand-*` 별칭 | 고정 브랜드 팔레트. 의미 이름이 값을 소유하고 `--brand-*`는 Tailwind와 상속된 고정색을 위한 별칭으로 남김 | 홈·브랜드 장식과 기존 관리자 표현. `text-purple` 같은 유틸은 공개 테마 안에서도 브랜드 색. 대응은 [매핑](tokens-mapping.md) |
| 같은 파일의 `--background`, `--foreground`, `--primary`, `--border`, `--ring`, radius 등 | shadcn 기반 UI의 의미 토큰과 Tailwind 연결 | `components/ui/`의 기존 컴포넌트를 사용하는 문맥 |
| [public-themes.css](../../app/public-themes.css)의 의미 토큰과 컴포넌트 토큰 | 공개 테마의 면·잉크·헤더·카드·버튼·진행률·필드·타이포·모서리·테두리·그림자·반복 간격. `pub-` 접두사는 없습니다. 역할이 갈리는 색은 컴포넌트 이름으로 남아 있습니다 | 공개 뷰나 명시적 공개 미리보기의 시각 표현 |
| `--toast-*` | 루트 Toaster의 테마별 표현 | [기존 토스트](../../components/ui/sonner.tsx)를 사용할 때. 토스트마다 팔레트를 다시 만들지 않음 |

공개 테마 토큰은 의미 이름 또는 컴포넌트 이름을 직접 씁니다. `pub-` 접두사 별칭은 제거했습니다. `--brand-*`는 지우지 않습니다. 이름과 제거분은 [토큰 매핑](tokens-mapping.md)이 현재 기준입니다.

`--brand-*`와 공개 의미 토큰은 값이 비슷해도 적용 범위가 다릅니다. 공개 화면에 브랜드 색을 직접 넣으면 선택 테마가 무시될 수 있으므로 해당 역할의 공개 토큰·클래스를 먼저 확인합니다. 반대로 관리자 shell을 `.pub-page`로 감싸는 방식으로 공개 테마를 확장하지 않습니다. Tailwind 색 유틸은 `@theme inline`에서 `--brand-*`를 가리키므로, `.pub-page`가 의미 토큰을 덮어써도 `text-purple` 같은 고정 브랜드 유틸은 테마 색으로 바뀌지 않습니다. 근거: [매핑의 배선](tokens-mapping.md).

## 공개 테마와 표현

지원 테마와 기본값은 [theme.ts](../../src/lib/wishlist/theme.ts), 실제 팔레트·형태는 [CSS](../../app/public-themes.css)를 확인합니다.

| 테마 | 현재 표현의 차이 |
| --- | --- |
| `pixel_y2k` | 기본값. 도트·두꺼운 선·오프셋 그림자·작은 모서리·픽셀 제목과 라벨 |
| `mono_bw` | 흑백·직각·그림자 없음·sans 제목과 라벨 |
| `soft_pastel` | 파스텔·둥근 면·부드러운 그림자·sans 제목과 라벨 |

선택 테마는 [공개 뷰](../../components/public-wishlist-view.tsx)의 `main.pub-page[data-theme]`에 적용됩니다. 샘플도 같은 뷰를 사용합니다. 404·로딩·오류 경계는 themeId를 전달받지 않아 기본 표현을 쓰며, [개인별 OG](../../app/wishlist/[slug]/opengraph-image.tsx)는 고정 스타일입니다. 관리자 안내 내부의 공개 미리보기는 [기능별 예외](../superpowers/specs/2026-07-22-admin-first-entry-guide-design.md)입니다.

| 역할 | 기존 표현 | 선택할 때의 기준 |
| --- | --- | --- |
| 페이지·헤더 | `.pub-page`, `.pub-header`, `.pub-headline` | 페이지 테마와 헤더 위 제목을 함께 표현 |
| 카드·카드 제목 | `.pub-card`, `--headline` | 카드 안 제목은 `.pub-card`가 `--headline`을 `--ink`로 재정의. 헤더 `.pub-headline`은 카드 밖이라 테마 헤드라인을 유지. 헤더용 흰색 등을 카드에 직접 복사하지 않음 |
| 강조·상태 | `.pub-pill`, `.pub-pill-alt` | 상태의 뜻은 기존 문구로 유지하고 테마의 모양만 바꿈 |
| 행동 | [Button](../../components/ui/button.tsx)의 `theme`, `theme-primary`, `theme-accent`. 너비는 `size="block"`. 모양은 [public-themes.css](../../app/public-themes.css)의 `.theme-btn` | 공개 행동의 위계. `theme-primary`라는 이름만으로 관리자 `admin` variant와 같다고 가정하지 않음 |
| 진행률 | `.pub-progress` | [조회 서비스](../../src/lib/public-wishlist/service.ts)의 계산 결과와 [상태 판정](../../src/lib/wish-item/status.ts)을 표시 |
| 입력 | `.pub-field`와 공개 뷰 내부 필드 | [폼 패턴](patterns/form.md)의 레이블·제출 경로와 함께 사용 |

공개 토스트는 `.pub-page` 바깥의 루트 Toaster에 렌더링됩니다. 현재 CSS는 `body:has(.pub-page[data-theme=...])`로 테마 값을 전달하므로 토스트 범위를 바꿀 때 이 연결도 확인합니다. 기본 공개 경계처럼 `data-theme`가 없는 경우까지 선택 테마 토스트가 보장되는 것은 아닙니다.

## 영역별 컴포넌트 지도

| 대상 | 기존 재사용 대상 | 선택 기준·경계 |
| --- | --- | --- |
| 관리자 필드·지표·버튼 | [admin-ui.tsx](../../app/admin/admin-ui.tsx)의 `AdminField`, `AdminMetricGroup`, `AdminMetric`, 공통 클래스 | 관리자 기존 화면을 확장할 때 먼저 사용. shadcn으로 일괄 변환하지 않음 |
| 온보딩 입력 | [page.tsx](../../app/onboarding/page.tsx)의 내부 `Field`·입력 클래스, [BirthdayPicker](../../app/onboarding/birthday-picker.tsx) | 고정 브랜드 화면의 현행 흐름. 내부 함수는 공용 export가 아님 |
| 공개 필드·선물 카드 | [public-wishlist-view.tsx](../../components/public-wishlist-view.tsx)의 내부 `PublicField`·카드 구성, [제출 버튼](../../components/public-participation-submit-button.tsx) | 기존 공개 뷰 안에서 확장. 내부 함수를 다른 파일에서 import할 수 있다고 가정하지 않음 |
| 범용 UI 프리미티브 | [Button](../../components/ui/button.tsx), [Input](../../components/ui/input.tsx), [Field](../../components/ui/field.tsx), [Card](../../components/ui/card.tsx) 등 | 해당 화면이 이 계열을 사용하거나 기존 영역 컴포넌트가 없는 경우 API·스타일을 확인한 뒤 선택 |
| 날짜·선택 UI | [Calendar](../../components/ui/calendar.tsx), [Popover](../../components/ui/popover.tsx), [Select](../../components/ui/select.tsx) | 이미 사용하는 생일 선택 사례를 확인. 새 폼 라이브러리를 요구하지 않음 |
| 결과 안내 | [Sonner](../../components/ui/sonner.tsx), [관리자 이벤트](../../app/admin/admin-toast-events.tsx), [공개 이벤트](../../components/public-wishlist-toast-events.tsx) | 성공·오류·후속 행동은 [피드백 패턴](patterns/feedback.md)에서 확인 |

같은 기능의 UI라도 영역이 다르면 모양과 필드 wrapper가 다를 수 있습니다. 공통화가 필요하면 호출부와 동작 계약을 먼저 비교하고, 한 번 사용하는 구조를 미리 공용 패키지로 만들지 않습니다. 근거: 위 세 영역의 폼 구현과 [저장소 변경 원칙](../../AGENTS.md).

## 타이포·간격·반응형

- 픽셀 폰트는 [fonts.ts](../../app/fonts.ts)의 로컬 MonaS12 Bold이고, 역할 이름은 `--font-display`입니다. 본문 sans의 역할 이름은 `--font-body`이며 `font-sans` 유틸은 Geist 변수 `--font-sans`를 그대로 가리킵니다. 전역 sans 설정은 [layout](../../app/layout.tsx)과 [CSS](../../app/globals.css), 공개 제목·라벨·버튼의 폰트는 테마 CSS를 함께 확인합니다. 폰트 변수 선언만 보고 모든 한글의 실제 렌더링 폰트를 단정하지 않습니다. 대응은 [토큰 매핑](tokens-mapping.md)입니다.
- 공개 헤더와 본문은 기존 `max-w-6xl` 컨테이너와 `px-5 sm:px-8`을 사용합니다. 실제 선물은 `space-y-5`의 세로 목록이며 큰 화면에서 카드 내부가 이미지·내용·진행률 영역으로 나뉩니다. 로딩 skeleton의 다열 그리드를 완성 화면의 목록 규칙으로 복사하지 않습니다. 근거: [공개 뷰](../../components/public-wishlist-view.tsx), [공개 로딩](../../app/wishlist/[slug]/loading.tsx).
- 관리자 필드는 `space-y-2`, 추가 폼은 `grid gap-4`와 `md:grid-cols-2`를 사용합니다. 동일 문맥을 확장할 때 기존 간격을 우선합니다. 이 사례를 전 서비스의 유일한 spacing scale로 일반화하지 않습니다. 근거: [관리자 UI](../../app/admin/admin-ui.tsx), [선물 추가](../../app/admin/wishes/page.tsx).
- 숫자·통화·진행률은 기존 formatter와 계산 결과를 재사용합니다. 문구와 상태 라벨의 근거는 [copy.ts](../../src/lib/design/copy.ts)와 [status.ts](../../src/lib/wish-item/status.ts)입니다. 모든 화면 문구가 이미 이 파일에 모여 있는 것은 아닙니다.

## 차이와 확인할 사항

- 현 CSS에는 의미 토큰과 화면 내부의 직접 지정 색상·크기가 함께 존재합니다. 새 작업에서는 같은 역할의 기존 표현을 찾되, 문서 작성만으로 모든 스타일이 토큰화됐다고 설명하지 않습니다.
- 공개 필드에는 `outline-none`이 있고 `.pub-field` 자체에 별도 포커스 스타일이 없습니다. 공통 Button의 focus ring 존재를 모든 영역의 보장으로 확대하지 않습니다. 실제 키보드 포커스·대비·disabled 구분은 화면에서 확인해야 합니다.
- `soft_pastel`의 밝은 텍스트·배경 조합을 포함한 테마별 대비와 모션 설정은 이번 정적 대조로 검증하지 않았습니다. 전체 접근성 통과 또는 다크 모드 지원을 선언하지 않습니다.
- OG의 테마 연동, 전 영역의 필드·버튼 규격 통합, 전체 spacing scale은 이번 문서화에서 새로 결정하지 않았습니다.

## 확인 방법

[공개 테마 계약](../../src/lib/design/public-theme-contract.test.ts), [관리자 계약](../../src/lib/design/admin-theme-contract.test.ts), [폰트 계약](../../src/lib/design/font-contract.test.ts)은 구현의 일부 구조를 검사합니다. [샘플 테마 E2E](../../tests/sample/valid-themes.spec.ts)는 테마·동일 콘텐츠·폴백 표시를 확인하며, 스크린샷 기준 이미지 비교는 아닙니다.

UI를 수정할 때는 대상 코드와 테스트의 기대를 대조하고 관련 검증을 실행합니다. 공개 테마 변경은 세 테마를 확인하고, 레이아웃 변경은 모바일·데스크톱을 확인합니다. 현재 [Playwright 설정](../../playwright.config.ts)은 데스크톱 Chromium 하나이므로 모바일 검증 완료를 대신하지 않습니다.
