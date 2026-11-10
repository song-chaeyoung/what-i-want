# 의미 토큰 병합 매핑

코드 대조일: 2026-11-10

상태: 코어 색은 의미 이름으로 옮기고 그 `--pub-*` 별칭을 제거했습니다. 타이포, 모서리·테두리·그림자, 그리고 반복되는 간격은 의미 이름이 값을 갖고, 기존 `--pub-*` 별칭은 색 1단계처럼 남겨 두었습니다. 진행률 트랙·역할이 갈리는 색·한 곳짜리 간격은 바꾸지 않았습니다. 값은 [globals.css](../../app/globals.css)의 `:root`·`@theme inline`과 [public-themes.css](../../app/public-themes.css)의 테마 블록이 원본입니다. 이 표는 그 선언을 옮긴 것이고, 화면을 다시 측정한 값은 아닙니다.

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

## 타이포

글꼴 패밀리와 글자 크기, 그리고 같은 역할에 이미 붙어 있던 굵기·행간·자간·대문자 변환만 옮겼습니다. 테마마다 다른 값은 그대로입니다. 픽셀 제목은 36px, 모노와 파스텔 제목은 30px입니다.

`--font-mona`와 `--font-sans`는 Next 폰트가 `html`에 넣는 변수입니다. 역할 이름이 그 변수를 가리키고, 폰트 등록 이름은 바꾸지 않습니다.

| 의미 토큰 | `:root` 값 | 쓰는 곳 |
| --- | --- | --- |
| `--font-display` | `var(--font-mona)` | `.font-pixel`, `.sticker-label`은 `var(--font-display), Arial, Helvetica, sans-serif`. 공개 `pixel_y2k`의 제목·라벨·필·버튼은 `var(--font-display, Arial, Helvetica, sans-serif)` |
| `--font-body` | `var(--font-sans)` | `.pub-page`, `mono_bw`·`soft_pastel`의 제목·라벨·필·버튼, 토스트. 공개 쪽은 `var(--font-body, Arial, Helvetica, sans-serif)`, 토스트는 `var(--font-body), Arial, Helvetica, sans-serif` |

두 형태를 한 문자열로 합치지 않았습니다. 변수가 있을 때 `var(--font-mona, Arial, Helvetica, sans-serif)`는 Mona 패밀리만 쓰고, `var(--font-mona), Arial, Helvetica, sans-serif`는 Arial 이하를 뒤에 붙입니다. 없는 글자의 폴백이 달라집니다.

`font-sans` 유틸은 `@theme inline`의 `--font-sans: var(--font-sans)`를 그대로 씁니다. `--font-body`로 다리를 바꾸면 유틸이 `var(--font-body)`를 가리키고, 나중에 테마가 `--font-body`를 덮으면 고정 본문 글꼴까지 바뀝니다. 색의 `--brand-*` 다리와 같은 이유입니다. `html`과 관리자 shell의 `font-sans` 클래스는 그대로입니다.

`@theme inline`에 넣은 글자 크기는 기존 임의 값과 같고, `line-height`는 넣지 않았습니다. 임의 클래스 `text-[10px]`도 글자 크기만 바꿨기 때문입니다. `text-xs`부터 `text-6xl`, `font-semibold` 같은 기본 스케일은 이 블록에 다시 적지 않았습니다.

| 유틸 | 값 | 바꾸기 전 |
| --- | --- | --- |
| `text-micro` | `10px` | `text-[10px]` |
| `text-caption` | `11px` | `text-[11px]` |
| `text-tab` | `13px` | `text-[13px]` |
| `text-nav` | `13.5px` | `text-[13.5px]` |

`text-[16px]`는 `text-base`로 바꿨습니다. 기본 `text-base`는 `1rem`이고 행간은 `calc(1.5 / 1)`입니다. preflight가 `html`에 주는 행간 `1.5`와 같습니다. 관리자 제목에 있던 `text-[14px]`는 `text-sm`으로 바꿨습니다. 그 요소는 `hidden`이고 `sm:`부터 `text-base`라, 보이는 구간은 16px입니다. `text-sm` 자체는 행간 `calc(1.25 / 0.875)`를 같이 넣으므로, 14px만 지정하던 클래스와 행간이 다릅니다. 기본 스케일을 고쳐 행간을 빼지는 않았습니다.

공개 테마 타이포는 의미 토큰이 값을 가집니다. `--pub-*` 별칭은 `var(--의미-토큰)`이고, 컴포넌트 규칙은 의미 이름을 직접 씁니다. 별칭은 호출부가 없는 것을 확인한 뒤의 색 2단계와 달리 아직 지우지 않습니다. `--label-size`와 `--pill-size`는 세 테마가 같은 12px라 `.pub-page` 블록에만 적고, 다른 테마 블록은 덮어쓰지 않습니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` | 남긴 별칭 |
| --- | --- | --- | --- | --- |
| `--headline-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `--pub-headline-font` |
| `--headline-weight` | `700` | `900` | `800` | `--pub-headline-weight` |
| `--headline-size` | `36px` | `30px` | `30px` | `--pub-headline-size` |
| `--headline-lh` | `1.4` | `1.18` | `1.3` | `--pub-headline-lh` |
| `--headline-ls` | `0` | `-1px` | `-0.4px` | `--pub-headline-ls` |
| `--label-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `--pub-label-font` |
| `--label-size` | `12px` | 같은 12px | 같은 12px | 없음. 원래 토큰이 아니라 `.pub-label`의 `12px` |
| `--label-weight` | `700` | `700` | `700` | `--pub-label-weight` |
| `--label-ls` | `0` | `1.6px` | `0.4px` | `--pub-label-ls` |
| `--label-transform` | `none` | `uppercase` | `none` | `--pub-label-transform` |
| `--pill-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `--pub-pill-font` |
| `--pill-weight` | `700` | `700` | `700` | `--pub-pill-weight` |
| `--pill-transform` | `none` | `uppercase` | `none` | `--pub-pill-transform` |
| `--pill-size` | `12px` | 같은 12px | 같은 12px | 없음. 원래 `.pub-pill`의 `12px` |
| `--btn-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `--pub-btn-font` |
| `--btn-weight` | `700` | `700` | `700` | `--pub-btn-weight` |
| `--btn-size` | `15px` | `14px` | `15px` | `--pub-btn-size` |

`--pub-label-color`는 색이라 이 표에 없습니다. `.pub-eyebrow`의 `font-size: 12px`와 `text-transform: uppercase`도 토큰으로 바꾸지 않았습니다. 라벨 크기와 숫자가 같아도, 눈썹은 테마의 `--label-transform`을 쓰지 않습니다.

합치지 않은 가까운 값:

| 현재 | 그대로 둔 이유 |
| --- | --- |
| `.sticker-label`의 `font-size: 0.75rem` | 루트 16px에서 12px와 같아 보여도 단위가 다름. `--label-size`로 합치지 않음 |
| 토스트의 `font-size: 14px` | `text-sm`은 `0.875rem`에 행간을 붙임. px만 같음 |
| `components/ui`의 `text-[0.8rem]` | shadcn 기본값. 위 스케일에 넣지 않음 |
| 빈 선물 자리의 `tracking-[1.6px]` | 한 곳의 자간. `--label-ls`의 모노 값 `1.6px`와 숫자가 같아도 역할이 다름 |
| OG `fontSize` | 이미지 생성용 인라인 숫자. CSS 토큰이 아님 |

## 모서리·테두리·그림자

공개 테마의 모양 값은 의미 이름이 갖고, `--pub-*`는 별칭입니다. 테마별 값은 그대로입니다. 진행률은 반지름·테두리만 이름을 바꿨고, 트랙·높이·채움은 `--pub-progress-*`로 남습니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` | 별칭 |
| --- | --- | --- | --- | --- |
| `--card-border` | `2px solid #171717` | `1.5px solid #111` | `none` | `--pub-border` |
| `--card-radius` | `4px` | `0` | `22px` | `--pub-radius` |
| `--card-shadow` | `6px 6px 0 #111827` | `none` | `0 10px 28px rgba(150, 120, 160, 0.16)` | `--pub-shadow` |
| `--card-shadow-lg` | `8px 8px 0 #111827` | `none` | `0 14px 32px rgba(150, 120, 160, 0.18)` | `--pub-shadow-lg` |
| `--card-shadow-sm` | `3px 3px 0 #111827` | `none` | `0 6px 16px rgba(150, 120, 160, 0.2)` | `--pub-shadow-sm` |
| `--header-border` | `2px solid #171717` | `1.5px solid #111` | `none` | `--pub-header-border` |
| `--pill-border` | `2px solid #171717` | `1.5px solid #111` | `none` | `--pub-pill-border` |
| `--pill-radius` | `0` | `0` | `999px` | `--pub-pill-radius` |
| `--pill-shadow` | `3px 3px 0 #111827` | `none` | `none` | `--pub-pill-shadow` |
| `--btn-radius` | `4px` | `0` | `16px` | `--pub-btn-radius` |
| `--btn-border` | `2px solid #171717` | `1.5px solid #111` | `none` | `--pub-btn-border` |
| `--btn-shadow` | `3px 3px 0 #111827` | `none` | `0 6px 16px rgba(150, 120, 160, 0.2)` | `--pub-btn-shadow` |
| `--progress-border` | `2px solid #171717` | `1.5px solid #111` | `none` | `--pub-progress-border` |
| `--progress-radius` | `2px` | `0` | `999px` | `--pub-progress-radius` |
| `--field-border` | `2px solid #171717` | `1.5px solid #111` | `1.5px solid #f0dfe9` | `--pub-field-border` |
| `--field-radius` | `4px` | `0` | `14px` | `--pub-field-radius` |

고정 픽셀 그림자는 [globals.css](../../app/globals.css)의 `:root`와 `@theme inline`에 같은 리터럴로 있습니다. 유틸은 `@theme` 리터럴을 Tailwind 그림자 래퍼에 넣고, `.pixel-board`·`.pixel-card`·`.sticker-label`은 `:root` 변수를 `box-shadow`에 그대로 씁니다.

| 유틸·변수 | 값 | 바꾼 사용처 |
| --- | --- | --- |
| `shadow-pixel-sm` / `--shadow-pixel-sm` | `3px 3px 0 #111827` | 임의 유틸 5곳, 스티커 라벨 |
| `shadow-pixel-md` / `--shadow-pixel-md` | `4px 4px 0 #111827` | 임의 유틸 4곳 |
| `shadow-pixel-lg` / `--shadow-pixel-lg` | `6px 6px 0 #111827` | 임의 유틸 4곳, `.pixel-card` |
| `shadow-pixel-xl` / `--shadow-pixel-xl` | `8px 8px 0 #111827` | `.pixel-board` |
| `shadow-header-line` / `--shadow-header-line` | `0 1px 0 rgba(24, 24, 27, 0.02)` | 관리자 헤더와 로딩 헤더 |

픽셀 테마의 `--card-shadow-lg`·`--card-shadow-sm`·`--pill-shadow`·`--btn-shadow`는 위 고정 그림자와 픽셀이 같아도 별도 토큰입니다. `mono_bw`는 `none`이고 `soft_pastel`은 흐린 그림자입니다.

그대로 둔 모양:

| 현재 | 그대로 둔 이유 |
| --- | --- |
| 안내 창의 `shadow-[5px_5px_0_#111827]`, `sm:shadow-[7px_7px_0_#111827]` | 한 곳씩인 5px·7px |
| Tailwind 기본 `rounded-md`, `border-2`, `shadow-md` | 기본 스케일 |
| shadcn `rounded-[min(var(--radius-md),...)]` | 컴포넌트 기본 모서리 상한 |
| `--radius-pub`, `--shadow-pub` | 기존 공개 유틸. 테마 `--card-radius`·`--card-shadow`와 값이 다름 |
| `--toast-*` | `.pub-page` 밖 토스트. 그림자에 `4px 4px 0 #111827`가 있어도 `shadow-pixel-md`로 합치지 않음 |
| `soft_pastel`의 `.pub-btn:not(.pub-btn-primary):not(.pub-btn-accent)` | `border: 1.5px solid #f0dfe9`, `box-shadow: none`. `--btn-border`는 `none` |
| `mono_bw` 헤더 필 `1.5px solid rgba(255,255,255,0.6)`, 지표 `1.5px solid rgba(255,255,255,0.5)` | 테마 `--pill-border`·`--card-border`와 다른 반투명 선 |

## 간격

필 안쪽 여백은 테마마다 다르고, 버튼 여백·필 간격·버튼 간격은 세 테마가 같은 공유 블록에 있습니다. `--pub-pill-pad`는 별칭입니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` | 별칭 |
| --- | --- | --- | --- | --- |
| `--pill-pad` | `7px 10px 6px` | `6px 10px` | `7px 12px` | `--pub-pill-pad` |
| `--btn-pad` | `15px 18px` | 같은 값 | 같은 값 | 없음. 원래 `.pub-btn`의 `15px 18px` |
| `--btn-gap` | `8px` | 같은 값 | 같은 값 | 없음. 원래 `.pub-btn`의 `8px` |
| `--pill-gap` | `6px` | 같은 값 | 같은 값 | 없음. 원래 `.pub-pill`의 `6px` |

관리자 사이드바는 [layout.tsx](../../app/admin/layout.tsx)의 본문과 로딩 화면 `aside` 두 곳입니다. `@theme inline`에 너비와 간격을 따로 등록합니다. 값이 달라 하나의 spacing 키로 합치지 않습니다. `--spacing-admin-sidebar`는 `py-admin-sidebar` 외의 간격 유틸(`p-admin-sidebar` 등)도 만들 수 있지만, 지금 소스는 `py-admin-sidebar`만 써서 생성 CSS에는 그 클래스만 있습니다.

| 유틸 | 테마 키 | 값 |
| --- | --- | --- |
| `w-admin-sidebar` | `--width-admin-sidebar` | `220px` |
| `py-admin-sidebar` | `--spacing-admin-sidebar` | `22px` |

그대로 둔 간격:

| 현재 | 그대로 둔 이유 |
| --- | --- |
| Tailwind 기본 `p-4`, `gap-2` 등 | 기본 spacing 스케일 |
| `.sticker-label`의 `padding: 0.25rem 0.625rem` | 한 곳의 rem 여백 |
| `max-w-[760px]`, `max-w-[430px]`, `h-[260px]`, `h-[190px]` | 안내 창·비네트의 한 곳짜리 크기 |
| `min-h-[calc(...)]`, `max-h-[calc(100dvh-16px)]`, `w-[calc(100%-16px)]`, `min-h-[50vh]`, `w-[85%]` | 한 곳짜리 임의 값. 이름을 만들지 않음 |

## 아직 의미 이름으로 바꾸지 않는 `--pub-*`

아래는 역할 전용으로 두거나, 대응이 분명해지면 따로 매핑합니다. 타이포·모양·필 여백으로 옮긴 `--pub-*`는 위 표의 별칭으로만 남아 있고, 이 목록에는 없습니다.

| 묶음 | 토큰 |
| --- | --- |
| 배경 패턴 | `--pub-bg-dots`, `--pub-dot-size`, `--pub-header-dots` |
| 진행률 형태 | `--pub-progress-track`, `--pub-progress-h`, `--pub-progress-fill` |
| 필드 | `--pub-field-bg` |
| 필 색 | `--pub-pill-bg`, `--pub-pill-color`, `--pub-pill-alt-bg`, `--pub-pill-alt-color` |
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

[별칭 계약](../../src/lib/design/semantic-token-alias.test.ts)은 `:root` 브랜드 별칭, 세 테마 의미 토큰의 기존 리터럴, 카드의 `--headline: var(--ink)`, 타이포·모양·간격 의미 토큰이 예전 `--pub-*` 리터럴로 풀리는지, 고정 픽셀 그림자와 관리자 사이드바 테마 키, 그리고 `app/`·`components/`에 제거한 색 `--pub-*`가 없는지를 봅니다. 이 비교는 브라우저 계산값을 대신하지 않습니다.

[Tailwind 유틸 계약](../../src/lib/design/tailwind-brand-utility.test.ts)은 `@tailwindcss/postcss` 4.3으로 `app/globals.css`를 dev·production 두 방식으로 컴파일합니다. `.text-purple` 등이 `var(--brand-*)`를 참조하는지, 의미 토큰 유틸이 `var(--headline)`처럼 테마 변수를 그대로 두는지, 제거한 색 `--pub-*`가 생성 CSS에 없는지를 확인합니다. `text-micro` 등은 `font-size`만 갖고, `text-sm`·`text-base` 기본 스케일은 행간을 유지하는지도 봅니다. `shadow-pixel-*`와 `shadow-header-line`은 예전 임의 유틸과 같은 Tailwind 그림자 래퍼이고, `shadow-md`·`shadow-pub`는 그대로인지도 봅니다. `w-admin-sidebar`는 `220px`, `py-admin-sidebar`는 `22px`인지도 봅니다. Chrome이 있으면 그 CSS를 세 테마와 테마 없는 기본 `.pub-page`에 적용해 계산색, 글꼴·글자 크기·굵기·행간·자간, 카드·필·버튼·진행률·필드의 테두리·모서리·그림자, 필·버튼의 여백과 간격을 확인합니다. 카드 제목은 잉크, 헤더 제목과 헤더 지표는 테마 헤드라인, 브랜드 유틸과 상속된 `--brand-purple`은 `#4c1d95`인지 봅니다. 토스트는 테마 리터럴과 브랜드 폴백을 구분합니다.

[관리자 테마 계약](../../src/lib/design/admin-theme-contract.test.ts)은 `--color-*` 다리가 `--brand-*`를 가리키는지 확인합니다. 2026-11-06에 개발 서버의 홈과 `/sample?theme=` 세 테마를 Chrome 계산색으로 따로 대조했습니다. 그 확인은 위 테스트 계약을 대신하지 않고, 관리자 로그인 화면은 열지 않았습니다.
