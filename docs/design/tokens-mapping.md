# 의미 토큰 병합 매핑

코드 대조일: 2026-11-06

상태: 1단계 별칭에 이어, 그때 매핑된 코어 색의 사용처를 의미 이름으로 옮기고 그 `--pub-*` 별칭만 제거했습니다. 타이포·간격·반지름·그림자·진행률 형태·역할이 갈리는 색은 바꾸지 않았습니다. 값은 [globals.css](../../app/globals.css)의 `:root`와 [public-themes.css](../../app/public-themes.css)의 테마 블록이 원본입니다. 이 표의 색은 그 선언을 옮긴 것이고, 화면을 다시 측정한 값은 아닙니다.

## 결정

`--brand-*`와 매핑된 `--pub-*`를 역할 이름(의미 토큰)으로 합칩니다. 적용 범위는 그대로 나뉩니다. 관리자·홈의 고정 팔레트와 공개 테마의 팔레트를 한 세트로 합치지 않습니다.

| 단계 | 하는 일 | 현재 |
| --- | --- | --- |
| 1. 별칭 | 의미 토큰이 값을 소유합니다. 기존 이름은 `var(--의미-토큰)`으로 가리킵니다. | 적용됨 |
| 2. 사용처 이전 | 매핑된 코어 색의 TSX·클래스가 의미 이름을 직접 사용합니다. | 이 변경. 매핑된 `--pub-*` 별칭은 제거 |
| 3. 브랜드 별칭 제거 | `--brand-*`를 삭제합니다. | 하지 않음. 아래 호환층으로 유지 |

공개 테마는 `:root`의 관리자 값을 그대로 물려받으면 `mono_bw`와 `soft_pastel`이 기본 팔레트로 바뀝니다. 각 `.pub-page[data-theme]` 블록은 그 테마의 기존 리터럴을 의미 토큰에 직접 적습니다. `data-theme`가 없는 `.pub-page`는 `pixel_y2k`와 같은 블록을 씁니다.

## 제거한 `--pub-*` 별칭

호출부와 테마 블록에서 의존이 없는 것을 확인한 뒤 지웠습니다. 같은 역할은 의미 토큰이 값을 가집니다.

| 제거한 별칭 | 이제 쓰는 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- | --- |
| `--pub-ink` | `--ink` | `#171717` | `#111` | `#5b5566` |
| `--pub-sub` | `--ink-muted` | `#3f3f46` | `#6b6b6b` | `#8b8398` |
| `--pub-bg` | `--surface-page` | `#fff7ed` | `#ffffff` | `#fbf5ff` |
| `--pub-surface` | `--surface` | `#fffdf7` | `#fff` | `#ffffff` |
| `--pub-header-bg` | `--surface-header` | `#fef3c7` | `#111111` | `#ffeaf3` |
| `--pub-headline-color`, `--pub-headline-on-header` | `--headline` | `#4c1d95` | `#fff` | `#bd6595` |
| `--pub-accent` | `--accent-main` | `#0f766e` | `#111` | `#7fb8ab` |
| `--pub-point` | `--point` | `#f97316` | `#111` | `#f79f97` |
| `--pub-fallback-bg` | `--tint-mint` | `#ccfbf1` | `#f3f3f3` | `#fdeef5` |
| `--pub-msg-bg` | `--tint-blush` | `#ffe4e6` | `#fafafa` | `#fdeef5` |

`--pub-headline-color`와 `--pub-headline-on-header`는 테마 값만 같았습니다. 카드 안 제목은 `.pub-card`가 `--headline: var(--ink)`로 덮어씁니다. 헤더의 `.pub-headline`은 카드 밖이라 테마 `--headline`을 그대로 씁니다. `mono_bw` 헤더 제목은 `#fff`, 카드 제목은 `#111`입니다. 헤더용 흰색을 카드에 복사하지 않습니다.

현재 마크업은 `.pub-headline`을 `.pub-card` 안에 넣지 않습니다. 둘을 같이 쓰면 카드의 `--headline` 덮어쓰기가 그 제목에도 적용됩니다. 이전에는 헤더 전용 별칭이 카드 덮어쓰기를 받지 않았습니다. 그 조합은 화면에 없고, 새 토큰을 만들지 않았습니다.

`soft_pastel`에서는 `--tint-mint`와 `--tint-blush`가 둘 다 `#fdeef5`입니다. 같은 값으로 만나도 토큰은 나눕니다. `pixel_y2k`에서는 민트와 블러시가 다릅니다.

## 남긴 `--brand-*`

`@theme inline`은 다리에 적은 값을 유틸 클래스에 그대로 넣습니다. `--color-purple: var(--headline)`이면 Tailwind 4.3이 `.text-purple { color: var(--headline); }`를 만들고, `mono_bw`가 `--headline`을 `#fff`로 덮으면 고정 브랜드 보라 `#4c1d95`가 아닙니다. 그래서 다리는 의미 토큰이 아니라 `--brand-*`를 가리킵니다.

`:root`에서 `--brand-purple: var(--headline)`은 그 요소에서 `#4c1d95`로 계산됩니다. 커스텀 속성은 이 계산값을 자식에게 상속합니다. `.pub-page`가 `--headline`만 `#fff`로 덮어써도, 상속된 `--brand-purple`은 `#4c1d95`로 남습니다. `.pub-page`에 `--brand-*` 리터럴을 다시 적지 않습니다. 그 재선언은 `@theme inline`이 유틸에 `--headline`을 직접 넣은 경우를 막지 못합니다.

이 때문에 `--brand-*`는 호환층으로 남깁니다. 홈의 `.pixel-dot-bg`, `.pixel-board`, `.sticker-label`과 토스트 기본 폴백(`--brand-line`, `--brand-teal`, `--brand-orange`, `--brand-purple`)도 이 별칭을 그대로 씁니다. 토스트는 `.pub-page` 밖이고, 테마별 `--toast-*` 리터럴은 `body:has(...)`에 남아 있습니다.

| 의미 토큰 | `:root` 값 | 남긴 브랜드 별칭 | 쓰는 곳 |
| --- | --- | --- | --- |
| `--ink` | `#171717` | `--brand-ink` | `@theme`의 `--color-ink`, 픽셀 테두리 |
| `--surface` | `#fffdf7` | `--brand-paper` | `@theme`의 `--color-paper` |
| `--surface-page` | `#fff7ed` | `--brand-cream` | `.pixel-dot-bg` |
| `--tint-yellow` | `#fef3c7` | `--brand-yellow` | `.sticker-label` |
| `--tint-mint` | `#ccfbf1` | `--brand-mint` | `@theme`의 `--color-mint` |
| `--tint-blush` | `#ffe4e6` | `--brand-blush` | 현재 호출부는 없음. 브랜드 쌍을 일부만 지우지 않음 |
| `--point` | `#f97316` | `--brand-orange` | `@theme`의 `--color-orange`, 토스트 warning 폴백 |
| `--accent-main` | `#0f766e` | `--brand-teal` | `@theme`의 `--color-teal`, 토스트 success 폴백 |
| `--headline` | `#4c1d95` | `--brand-purple` | `@theme`의 `--color-purple`, 토스트 info 폴백, 스티커 글자 |
| `--line` | `#d1d5db` | `--brand-line` | `@theme`의 `--color-line`, 토스트 테두리 폴백 |

`--ink-muted`와 `--surface-header`, `--line-strong`에는 브랜드 별칭이 없습니다. `--surface-header`와 `--tint-yellow`는 `:root`와 `pixel_y2k`에서 둘 다 `#fef3c7`이지만 역할이 다릅니다. `mono_bw` 헤더는 `#111111`, `soft_pastel` 헤더는 `#ffeaf3`이므로 테마가 덮어쓰는 이름은 `--surface-header`입니다. `--brand-yellow`는 `--tint-yellow`를 가리킵니다.

| 다리 | `@theme inline` 값 | 생성 유틸이 참조하는 값 | `:root`에서 풀린 색 |
| --- | --- | --- | --- |
| `--color-ink` | `var(--brand-ink)` | `var(--brand-ink)` | `#171717` |
| `--color-paper` | `var(--brand-paper)` | `var(--brand-paper)` | `#fffdf7` |
| `--color-line` | `var(--brand-line)` | `var(--brand-line)` | `#d1d5db` |
| `--color-teal` | `var(--brand-teal)` | `var(--brand-teal)` | `#0f766e` |
| `--color-purple` | `var(--brand-purple)` | `var(--brand-purple)` | `#4c1d95` |
| `--color-mint` | `var(--brand-mint)` | `var(--brand-mint)` | `#ccfbf1` |
| `--color-orange` | `var(--brand-orange)` | `var(--brand-orange)` | `#f97316` |

`text-purple`, `text-ink`, `bg-paper`, `border-line`, `text-teal`, `bg-mint`, `bg-orange` 같은 기존 브랜드 유틸은 세 테마 안에서도 `:root` 브랜드 색을 유지합니다. 공개 테마 색은 `.pub-page`의 의미 토큰과 남은 `--pub-*`가 담당합니다.

Tailwind는 문서의 옛 클래스 문자열도 유틸로 뽑습니다. [globals.css](../../app/globals.css)는 `@source not "../docs"`로 문서 경로를 스캔에서 빼, 지운 토큰 이름이 생성된 CSS에 다시 들어가지 않게 합니다. 앱과 컴포넌트 소스 탐지는 그대로입니다.

## 아직 의미 이름으로 바꾸지 않는 `--pub-*`

아래는 역할 전용으로 두거나, 대응이 분명해지면 따로 매핑합니다. 이번 단계에서 의미 이름을 새로 만들지 않습니다.

| 묶음 | 토큰 |
| --- | --- |
| 배경 패턴 | `--pub-bg-dots`, `--pub-dot-size`, `--pub-header-dots` |
| 타이포 | `--pub-headline-font`, `--pub-headline-weight`, `--pub-headline-size`, `--pub-headline-lh`, `--pub-headline-ls`, `--pub-label-font`, `--pub-label-ls`, `--pub-label-transform`, `--pub-label-weight` |
| 반지름 | `--pub-radius`, `--pub-pill-radius`, `--pub-btn-radius`, `--pub-field-radius`, `--pub-progress-radius` |
| 그림자 | `--pub-shadow`, `--pub-shadow-lg`, `--pub-shadow-sm`, `--pub-pill-shadow`, `--pub-btn-shadow` |
| 테두리 | `--pub-header-border`, `--pub-border`, `--pub-pill-border`, `--pub-btn-border`, `--pub-progress-border`, `--pub-field-border` |
| 진행률 형태 | `--pub-progress-track`, `--pub-progress-h`, `--pub-progress-fill` |
| 필드 | `--pub-field-bg` |
| 필·버튼 | `--pub-pill-bg`, `--pub-pill-color`, `--pub-pill-alt-bg`, `--pub-pill-alt-color`, `--pub-pill-font`, `--pub-pill-weight`, `--pub-pill-transform`, `--pub-pill-pad`, `--pub-btn-font`, `--pub-btn-weight`, `--pub-btn-size` |
| 역할 색 | `--pub-header-sub`, `--pub-label-color`, `--pub-stat-accent`, `--pub-on-point`, `--pub-divider-color`, `--pub-bank-bg`, `--pub-bank-ink`, `--pub-msg-title`, `--pub-msg-sub` |

`--toast-*`도 의미 토큰으로 바꾸지 않습니다. 토스트는 `.pub-page` 밖이라 `body:has(...)`의 리터럴을 유지합니다. `soft_pastel`은 warning·info를 적지 않아 브랜드 폴백(`--brand-orange`, `--brand-purple`)을 씁니다.

`pixel_y2k`에서만 값이 같은 것들은 별칭으로 묶지 않습니다. 다른 테마에서 갈라지기 때문입니다.

| `pixel_y2k`에서 코어 색과 같음 | 다른 테마 |
| --- | --- |
| `--pub-header-sub`, `--pub-label-color`, `--pub-stat-accent`는 `--accent-main`(`#0f766e`)과 같음 | `mono_bw`는 각각 `rgba(255, 255, 255, 0.6)`, `#9a9a9a`, `#fff`. `soft_pastel`의 `--pub-label-color`는 `#bd6595` |
| `--pub-pill-bg`는 `--point`와 같음 | `mono_bw`는 `transparent`, `soft_pastel`은 `#ffe1ec` |
| `--pub-pill-alt-bg`, `--pub-bank-bg`는 `--tint-mint`와 같음 | `mono_bw`는 `#111`, `#f6f6f6`. `soft_pastel`은 둘 다 `#dff1ec`이고 fallback `#fdeef5`와 다름 |

`--pub-progress-fill`은 현재 세 테마 모두 `--accent-main`과 같은 값입니다. 진행률 전용으로 남겨 두었고, `--accent-main`으로 합치지 않았습니다.

선물 없음 자리의 `GIFT` 그림은 테마별 클래스(`.gm-pixel`, `.gm-line`, `.gm-soft`) 안의 직접 색입니다. 매핑된 토큰 사용처가 아니라 이번 단계에서 바꾸지 않았습니다.

## 확인 방법

[별칭 계약](../../src/lib/design/semantic-token-alias.test.ts)은 `:root` 브랜드 별칭, 세 테마 의미 토큰의 기존 리터럴, 카드의 `--headline: var(--ink)`, 그리고 `app/`·`components/`에 제거한 `--pub-*`가 없는지를 봅니다. 이 비교는 브라우저 계산색을 대신하지 않습니다.

[Tailwind 유틸 계약](../../src/lib/design/tailwind-brand-utility.test.ts)은 `@tailwindcss/postcss` 4.3으로 `app/globals.css`를 dev·production 두 방식으로 컴파일합니다. `.text-purple` 등이 `var(--brand-*)`를 참조하는지, 의미 토큰 유틸이 `var(--headline)`처럼 테마 변수를 그대로 두는지, 제거한 `--pub-*`가 생성 CSS에 없는지를 확인합니다. Chrome이 있으면 그 CSS를 세 테마와 테마 없는 기본 `.pub-page`에 적용해 계산색을 확인합니다. 카드 제목은 잉크, 헤더 제목과 헤더 지표는 테마 헤드라인, 브랜드 유틸과 상속된 `--brand-purple`은 `#4c1d95`인지 봅니다. 토스트는 테마 리터럴과 브랜드 폴백을 구분합니다.

[관리자 테마 계약](../../src/lib/design/admin-theme-contract.test.ts)은 `--color-*` 다리가 `--brand-*`를 가리키는지 확인합니다. 2026-11-06에 개발 서버의 홈과 `/sample?theme=` 세 테마를 Chrome 계산색으로 따로 대조했습니다. 그 확인은 위 테스트 계약을 대신하지 않고, 관리자 로그인 화면은 열지 않았습니다.
