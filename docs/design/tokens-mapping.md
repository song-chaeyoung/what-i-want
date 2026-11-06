# 의미 토큰 병합 매핑 (초안)

코드 대조일: 2026-11-05

상태: 1단계(별칭)만 적용했습니다. 아래 이름은 초안이며 디자인에서 다듬을 수 있습니다. 컴포넌트 호출부를 새 이름으로 바꾸거나 `--brand-*`·`--pub-*`를 지우는 작업은 이 문서의 범위가 아닙니다.

값의 원본은 [globals.css](../../app/globals.css)의 `:root`와 [public-themes.css](../../app/public-themes.css)의 테마 블록입니다. 이 표의 색은 그 선언을 옮긴 것이고, 화면에서 다시 측정한 값은 아닙니다.

## 결정

`--brand-*`와 `--pub-*`를 역할 이름(의미 토큰)으로 합칩니다. 적용 범위는 그대로 나뉩니다. 관리자·홈의 고정 팔레트와 공개 테마의 팔레트를 한 세트로 합치지 않습니다.

| 단계 | 하는 일 | 현재 |
| --- | --- | --- |
| 1. 별칭 | 의미 토큰이 값을 소유합니다. 기존 이름은 `var(--의미-토큰)`으로 가리킵니다. | 이 변경 |
| 2. 사용처 이전 | TSX·클래스가 의미 이름을 직접 사용합니다. | 아직 아님 |
| 3. 기존 이름 제거 | `--brand-*`, 매핑이 끝난 `--pub-*` 별칭을 삭제합니다. | 아직 아님 |

공개 테마는 `:root`의 관리자 값을 그대로 물려받으면 `mono_bw`와 `soft_pastel`이 기본 팔레트로 바뀝니다. 각 `.pub-page[data-theme]` 블록은 그 테마의 기존 `--pub-*` 리터럴을 의미 토큰에 다시 적은 뒤, 대응되는 `--pub-*`만 `var(--의미-토큰)`으로 바꿉니다. `data-theme`가 없는 `.pub-page`는 `pixel_y2k`와 같은 블록을 씁니다.

## `:root` 의미 토큰과 브랜드 별칭

| 의미 토큰 | `:root` 값 | 브랜드 별칭 |
| --- | --- | --- |
| `--ink` | `#171717` | `--brand-ink` |
| `--ink-muted` | `#3f3f46` | 없음. 기획에서 추가. `pixel_y2k`의 `--pub-sub`과 같고 `--brand-*` 쌍은 없음 |
| `--surface` | `#fffdf7` | `--brand-paper` |
| `--surface-page` | `#fff7ed` | `--brand-cream` |
| `--surface-header` | `#fef3c7` | 없음. 헤더 면은 테마마다 달라서 `--brand-yellow`와 분리 |
| `--headline` | `#4c1d95` | `--brand-purple` |
| `--accent-main` | `#0f766e` | `--brand-teal` |
| `--point` | `#f97316` | `--brand-orange` |
| `--line` | `#d1d5db` | `--brand-line`. 공개 테마에 같은 역할의 `--pub-*` 쌍은 없음 |
| `--line-strong` | `#171717` | 없음. 새 초안이며 기존 토큰 별칭은 아직 없음 |
| `--tint-mint` | `#ccfbf1` | `--brand-mint` |
| `--tint-blush` | `#ffe4e6` | `--brand-blush` |
| `--tint-yellow` | `#fef3c7` | `--brand-yellow` |

`--surface-header`와 `--tint-yellow`는 `:root`와 `pixel_y2k`에서 둘 다 `#fef3c7`입니다. 역할은 다릅니다. `--brand-yellow`는 `--tint-yellow`를 가리킵니다. `mono_bw` 헤더는 `#111111`, `soft_pastel` 헤더는 `#ffeaf3`이므로 테마가 덮어쓰는 이름은 `--surface-header`입니다.

`@theme inline`은 다리에 적은 값을 유틸 클래스에 그대로 넣습니다. `--color-purple: var(--headline)`이면 Tailwind 4.3이 `.text-purple { color: var(--headline); }`를 만들고, `mono_bw`가 `--headline`을 `#fff`로 덮으면 고정 브랜드 보라 `#4c1d95`가 아닙니다. 그래서 다리는 의미 토큰이 아니라 기존 `--brand-*`를 가리킵니다.

| 다리 | `@theme inline` 값 | 생성 유틸이 참조하는 값 | `:root`에서 풀린 색 |
| --- | --- | --- | --- |
| `--color-ink` | `var(--brand-ink)` | `var(--brand-ink)` | `#171717` |
| `--color-paper` | `var(--brand-paper)` | `var(--brand-paper)` | `#fffdf7` |
| `--color-line` | `var(--brand-line)` | `var(--brand-line)` | `#d1d5db` |
| `--color-teal` | `var(--brand-teal)` | `var(--brand-teal)` | `#0f766e` |
| `--color-purple` | `var(--brand-purple)` | `var(--brand-purple)` | `#4c1d95` |
| `--color-mint` | `var(--brand-mint)` | `var(--brand-mint)` | `#ccfbf1` |
| `--color-orange` | `var(--brand-orange)` | `var(--brand-orange)` | `#f97316` |

## 테마별 핵심 매핑

각 칸은 그 테마가 의미 토큰에 넣는 기존 리터럴입니다. `--pub-*`는 이 의미 토큰의 별칭입니다.

| 의미 토큰 | `--pub-*` 별칭 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- | --- |
| `--ink` | `--pub-ink` | `#171717` | `#111` | `#5b5566` |
| `--ink-muted` | `--pub-sub` | `#3f3f46` | `#6b6b6b` | `#8b8398` |
| `--surface-page` | `--pub-bg` | `#fff7ed` | `#ffffff` | `#fbf5ff` |
| `--surface` | `--pub-surface` | `#fffdf7` | `#fff` | `#ffffff` |
| `--surface-header` | `--pub-header-bg` | `#fef3c7` | `#111111` | `#ffeaf3` |
| `--headline` | `--pub-headline-color`, `--pub-headline-on-header` | `#4c1d95` | `#fff` | `#bd6595` |
| `--accent-main` | `--pub-accent` | `#0f766e` | `#111` | `#7fb8ab` |
| `--point` | `--pub-point` | `#f97316` | `#111` | `#f79f97` |
| `--tint-mint` | `--pub-fallback-bg` | `#ccfbf1` | `#f3f3f3` | `#fdeef5` |
| `--tint-blush` | `--pub-msg-bg` | `#ffe4e6` | `#fafafa` | `#fdeef5` |

`--pub-headline-on-header`는 현재 세 테마에서 `--pub-headline-color`와 같은 값이라 `--headline` 별칭을 같이 씁니다. 카드 안 제목은 그대로 `.pub-card`가 `--pub-headline-color: var(--pub-ink)`로 덮어씁니다. 헤더용 색을 카드에 복사하지 않습니다.

`soft_pastel`에서는 `--tint-mint`와 `--tint-blush`가 둘 다 `#fdeef5`입니다. 같은 값으로 만나도 토큰은 나눕니다. `pixel_y2k`에서는 민트와 블러시가 다릅니다.

## 지금 별칭으로 만들지 않는 `--pub-*`

아래는 이후 단계에서 역할 전용으로 두거나, 대응이 분명해지면 따로 매핑합니다. 이번 단계에서 의미 이름을 새로 만들지 않습니다.

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

`--toast-*`도 이 단계에서 의미 토큰으로 바꾸지 않습니다. 토스트는 `.pub-page` 밖이라 `body:has(...)` 선언을 유지합니다.

`pixel_y2k`에서만 값이 같은 것들은 별칭으로 묶지 않습니다. 다른 테마에서 갈라지기 때문입니다.

| `pixel_y2k`에서 `--accent-main`(`#0f766e`)과 같음 | 다른 테마 |
| --- | --- |
| `--pub-header-sub`, `--pub-label-color`, `--pub-stat-accent` | `mono_bw`는 각각 `rgba(255, 255, 255, 0.6)`, `#9a9a9a`, `#fff`. `soft_pastel`의 `--pub-label-color`는 `#bd6595` |
| `--pub-pill-bg`는 `--point`와 같음 | `mono_bw`는 `transparent`, `soft_pastel`은 `#ffe1ec` |
| `--pub-pill-alt-bg`, `--pub-bank-bg`는 `--tint-mint`와 같음 | `mono_bw`는 `#111`, `#f6f6f6`. `soft_pastel`은 둘 다 `#dff1ec`이고 fallback `#fdeef5`와 다름 |

`--pub-progress-fill`은 현재 세 테마 모두 `--pub-accent`와 같은 값입니다. 진행률 전용으로 남겨 두었고, 이번 단계에서 `--accent-main` 별칭으로 만들지 않았습니다.

## `.pub-page` 안의 브랜드 색

`:root`에서 `--brand-purple: var(--headline)`은 그 요소에서 `#4c1d95`로 계산됩니다. 커스텀 속성은 이 계산값을 자식에게 상속합니다. `.pub-page`가 `--headline`만 `#fff`로 덮어써도, 상속된 `--brand-purple`은 `#4c1d95`로 남습니다. `.pub-page`에 `--brand-*` 리터럴을 다시 적지 않습니다. 그 재선언은 `@theme inline`이 유틸에 `--headline`을 직접 넣은 경우를 막지 못합니다.

공개 테마의 색은 테마 블록의 의미 토큰과 `--pub-*` 별칭이 담당합니다. `text-purple`, `text-ink`, `bg-paper`, `border-line`, `text-teal`, `bg-mint`, `bg-orange` 같은 기존 브랜드 유틸은 세 테마 안에서도 `:root` 브랜드 색을 유지합니다.

호출부는 아직 `--brand-*`와 `--pub-*`를 사용합니다. 2단계에서 `.pub-page` 안으로 의미 토큰을 직접 쓸 때는 유틸이 그 이름을 참조하지 않는지 다시 확인합니다.

## 확인 방법

[별칭 계약](../../src/lib/design/semantic-token-alias.test.ts)은 `:root` 브랜드 별칭과 세 테마의 기존 `--pub-*`를 소스의 `var()` 체인으로 비교합니다. 이 비교는 `@theme inline`이 유틸에 값을 넣는 방식과, 브라우저가 브랜드 별칭의 계산값을 상속하는 방식을 대신하지 않습니다.

[Tailwind 유틸 계약](../../src/lib/design/tailwind-brand-utility.test.ts)은 `@tailwindcss/postcss` 4.3으로 `app/globals.css`를 컴파일해 `.text-purple` 등이 `var(--brand-*)`를 참조하는지 확인합니다. Chrome이 있으면 그 CSS를 세 테마에 적용한 계산색도 확인합니다. [관리자 테마 계약](../../src/lib/design/admin-theme-contract.test.ts)은 `--color-*` 다리가 `--brand-*`를 가리키는지 확인합니다. 앱 화면을 브라우저로 다시 연 검증은 이 문서의 범위에 없습니다.
