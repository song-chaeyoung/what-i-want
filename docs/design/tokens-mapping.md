# 의미 토큰 병합 매핑

코드 대조일: 2026-11-10. 버튼 색 토큰 추가 대조일: 2026-11-13. 카드 글자·면 토큰 추가 대조일: 2026-11-14. 필·상태 색 토큰 추가 대조일: 2026-11-14.

상태: 공개 테마 커스텀 속성에서 `pub-` 접두사를 뺐습니다. 코어 색·타이포·모서리·테두리·그림자·반복 간격은 의미 이름이 값을 갖고, 그 별칭은 제거했습니다. 값을 직접 갖고 있던 나머지는 접두사만 뺀 이름으로 바꿨습니다. 세 테마의 리터럴은 그대로입니다. 값은 [globals.css](../../app/globals.css)의 `:root`·`@theme inline`과 [public-themes.css](../../app/public-themes.css)의 테마 블록이 원본입니다. 이 표는 그 선언을 옮긴 것이고, 화면을 다시 측정한 값은 아닙니다.

## 결정

`--brand-*`와 매핑된 `--pub-*`를 역할 이름(의미 토큰)으로 합칩니다. 적용 범위는 그대로 나뉩니다. 관리자·홈의 고정 팔레트와 공개 테마의 팔레트를 한 세트로 합치지 않습니다.

| 단계 | 하는 일 | 현재 |
| --- | --- | --- |
| 1. 별칭 | 의미 토큰이 값을 소유합니다. 기존 이름은 `var(--의미-토큰)`으로 가리킵니다. | 적용됨 |
| 2. 사용처 이전 | TSX·클래스가 의미 이름 또는 접두사를 뺀 이름을 직접 사용합니다. | 적용됨. `pub-` 접두사 별칭은 제거 |
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

`--pub-headline-color`와 `--pub-headline-on-header`는 테마 값만 같았습니다. 카드 안 제목은 `.theme-card`가 `--headline: var(--ink)`로 덮어씁니다. 헤더의 `.pub-headline`은 카드 밖이라 테마 `--headline`을 그대로 씁니다. `mono_bw` 헤더 제목은 `#fff`, 카드 제목은 `#111`입니다. 헤더용 흰색을 카드에 복사하지 않습니다.

지표(`.pub-stat`)는 카드와 같은 면·테두리·모서리·그림자를 `.theme-card`에서 받습니다. 값 색은 테마 헤드라인을 유지해야 해서 `.theme-card.pub-stat`이 `--headline: inherit`로 카드의 잉크 덮어쓰기를 되돌립니다. `mono_bw`와 `soft_pastel`의 `.pub-stat` 전용 규칙은 그대로입니다.

현재 마크업은 `.pub-headline`을 `.theme-card` 안에 넣지 않습니다. 둘을 같이 쓰면 카드의 `--headline` 덮어쓰기가 그 제목에도 적용됩니다. 이전에는 헤더 전용 별칭이 카드 덮어쓰기를 받지 않았습니다. 그 조합은 화면에 없고, 새 토큰을 만들지 않았습니다.

`soft_pastel`에서는 `--tint-mint`와 `--tint-blush`가 둘 다 `#fdeef5`입니다. 같은 값으로 만나도 토큰은 나눕니다. `pixel_y2k`에서는 민트와 블러시가 다릅니다.

## 남긴 `--brand-*`

`@theme inline`은 다리에 적은 값을 유틸 클래스에 그대로 넣습니다. `--color-purple: var(--headline)`이면 Tailwind 4.3이 `.text-purple { color: var(--headline); }`를 만들고, `mono_bw`가 `--headline`을 `#fff`로 덮으면 고정 브랜드 보라 `#4c1d95`가 아닙니다. 그래서 다리는 의미 토큰이 아니라 `--brand-*`를 가리킵니다.

`:root`에서 `--brand-purple: var(--headline)`은 그 요소에서 `#4c1d95`로 계산됩니다. 커스텀 속성은 이 계산값을 자식에게 상속합니다. `.pub-page`가 `--headline`만 `#fff`로 덮어써도, 상속된 `--brand-purple`은 `#4c1d95`로 남습니다. `.pub-page`에 `--brand-*` 리터럴을 다시 적지 않습니다. 그 재선언은 `@theme inline`이 유틸에 `--headline`을 직접 넣은 경우를 막지 못합니다.

이 때문에 `--brand-*`는 호환층으로 남깁니다. 홈의 `.pixel-dot-bg`, `.sticker-label`과 토스트 기본 폴백(`--brand-line`, `--brand-teal`, `--brand-orange`, `--brand-purple`)도 이 별칭을 그대로 씁니다. 쓰이지 않던 `.pixel-board`와 `.pixel-card`는 2026-11-14에 지웠습니다. 토스트는 `.pub-page` 밖이고, 테마별 `--toast-*` 리터럴은 `body:has(...)`에 남아 있습니다.

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

`text-purple`, `text-ink`, `bg-paper`, `border-line`, `text-teal`, `bg-mint`, `bg-orange` 같은 기존 브랜드 유틸은 세 테마 안에서도 `:root` 브랜드 색을 유지합니다. 공개 테마 색은 `.pub-page`의 의미 토큰과 컴포넌트 토큰이 담당합니다.

## 버튼 색

2026-11-13에 버튼에 직접 적혀 있던 색을 `:root` 토큰으로 옮겼습니다. 값은 그때의 하드코드와 같습니다. `@theme inline`의 `--color-*` 다리는 그 변수를 가리켜 `bg-ink-deep`, `text-danger`, `bg-kakao` 같은 유틸이 나오게 합니다. 공개 테마는 이 다섯 값을 덮어쓰지 않습니다.

| 의미 토큰 | `:root` 값 | 유틸 다리 | 바꾸기 전 |
| --- | --- | --- | --- |
| `--ink-deep` | `#111827` | `--color-ink-deep` | 홈·온보딩·404·오류의 진한 버튼 면 |
| `--danger` | `#b91c1c` | `--color-danger` | 관리자 삭제·초기화 글자와 테두리 |
| `--danger-tint` | `#fef2f2` | `--color-danger-tint` | 그 버튼의 호버 면 |
| `--kakao` | `#fee500` | `--color-kakao` | 로그인 Kakao 버튼 면 |
| `--kakao-hover` | `#f6dc00` | `--color-kakao-hover` | 그 버튼의 호버 면 |

`--line-strong`(`#171717`)와 `--accent-main`(`#0f766e`)는 새 값이 아닙니다. 버튼 유틸 `border-line-strong`, `bg-accent-main`이 나오게 `--color-line-strong`, `--color-accent-main` 다리만 추가했습니다. `--color-accent-main`은 `var(--accent-main)`이라 공개 테마 안에서는 그 테마 색을 따릅니다. 홈 CTA는 `.pub-page` 밖입니다.

## 카드 글자와 관리자 면

2026-11-14에 카드와 본문 글자에 직접 적혀 있던 색을 `:root` 토큰으로 옮겼습니다. `@theme inline`의 `--color-*` 다리는 그 변수를 가리켜 `text-ink-soft`, `bg-admin-bg` 같은 유틸이 나오게 합니다. 공개 테마는 이 네 값을 덮어쓰지 않습니다.

| 의미 토큰 | `:root` 값 | 유틸 다리 | 바꾸기 전 |
| --- | --- | --- | --- |
| `--ink-soft` | `#4b5563` | `--color-ink-soft` | 본문 회색 글자 |
| `--ink-faint` | `#6b7280` | `--color-ink-faint` | 보조 글자 |
| `--admin-bg` | `#fafaf9` | `--color-admin-bg` | 관리자 페이지 배경, 카드 hover |
| `--admin-subtle` | `#fbfbfa` | `--color-admin-subtle` | 사이드바, 모바일 탭, 카드 아래칸 |

`#171717`는 기존 `ink`, `#fffdf7`는 `paper`, `#4c1d95`는 `purple`입니다. 이 유틸은 `--brand-*`를 가리키므로 `.pub-page` 안에서도 `:root` 색을 유지합니다. `#0f766e`를 `accent-main`으로 바꾼 곳은 `.pub-page` 밖입니다. `--color-accent-main`은 `var(--accent-main)`이라 공개 테마 안에서는 테마 색이 됩니다.

카드 껍데기는 [Card](../../components/ui/card.tsx) variant입니다. `pixel`은 `border-2 border-ink`에 `paper` 또는 `white`, 그림자는 `shadow-pixel-xs`·`md`·`lg` 또는 없음입니다. `theme`은 `.theme-card`를 감쌉니다. `admin`은 `rounded-md border border-line bg-white`이고, 아래칸은 `border-t border-line bg-admin-subtle`, hover는 `bg-admin-bg`입니다. shadcn 기본 `default` variant는 그대로입니다.

Tailwind는 문서의 옛 클래스 문자열도 유틸로 뽑습니다. [globals.css](../../app/globals.css)는 `@source not "../docs"`로 문서 경로를 스캔에서 빼, 지운 토큰 이름이 생성된 CSS에 다시 들어가지 않게 합니다. 앱과 컴포넌트 소스 탐지는 그대로입니다.

## 필·상태·알림 색

2026-11-14에 상태 배지, 알림, 선물 그림, 홈 예시, 꽃가루에 직접 적혀 있던 색을 토큰으로 옮겼습니다. 값은 그때의 하드코드와 같습니다. 화면 픽셀은 바꾸지 않는 것이 목표입니다.

| 의미 토큰 | 값 | 유틸 다리 | 쓰는 곳 |
| --- | --- | --- | --- |
| `--success` | `#10b981` | `--color-success` | 진행 중 점, 꽃가루 |
| `--success-tint` | `#ecfdf5` | `--color-success-tint` | 진행 중 배지 면 |
| `--success-ink` | `#047857` | `--color-success-ink` | 진행 중 배지 글자 |
| `--warn-tint` | `#fff7ed` | `--color-warn-tint` | 멈춤 배지, 메시지 선물 이름, 주황 알림 면 |
| `--warn-ink` | `#9a3412` | `--color-warn-ink` | 그 글자, 만 14세 경고 |
| `--info` | `#3b82f6` | `--color-info` | 완료 점 |
| `--info-tint` | `#eff6ff` | `--color-info-tint` | 완료 배지 면 |
| `--info-ink` | `#1d4ed8` | `--color-info-ink` | 완료 배지 글자 |
| `--muted-tint` | `#f4f4f5` | `--color-muted-tint` | 숨김 배지 면 |
| `--track` | `#f3f4f6` | `--color-track` | 홈 예시 진행 트랙 |
| `--confetti-violet` | `#7c3aed` | 없음. `:root`만 | 꽃가루 |
| `--confetti-amber` | `#f59e0b` | 없음. `:root`만 | 꽃가루 |
| `--confetti-pink` | `#ec4899` | 없음. `:root`만 | 꽃가루 |
| `--gift-soft-bg` | `#ffe1ec` | 없음. `soft_pastel`만 | 둥근 선물 그림 면 |
| `--gift-soft-ink` | `#bd6595` | 없음. `soft_pastel`만 | 둥근 선물 그림 글자 |

`--warn-tint`는 `:root`의 `--surface-page`와 값이 같아도 별도 토큰입니다(2026-11-14 채영 결정). `var(--surface-page)`로 가리키지 않습니다.

꽃가루 세 색은 `:root`에만 있습니다. `@theme inline`에 `--color-confetti-*`를 넣지 않습니다(2026-11-14 채영 결정). 조각은 [birthday-confetti.tsx](../../app/admin/birthday-confetti.tsx)의 `<span style>` `backgroundColor`라 `var()`가 계산됩니다. canvas가 아닙니다.

`--gift-soft-*`는 `soft_pastel` 블록에만 있습니다. 다른 테마의 `.gm-soft`는 보이지 않습니다.

새 색은 아니지만 `@theme inline`에 다리를 추가했습니다.

| 다리 | 값 | 생성 유틸 |
| --- | --- | --- |
| `--color-point` | `var(--point)` | `bg-point`, `border-point`. 테마가 `--point`를 덮으면 그 색 |
| `--color-blush` | `var(--tint-blush)` | `bg-blush`. 테마 `--tint-blush` |
| `--color-yellow` | `var(--tint-yellow)` | `bg-yellow`. 테마는 `--tint-yellow`를 덮지 않아 `:root` `#fef3c7` |

`--color-point`는 새 색이 아닙니다. `bg-point`와 `border-point`가 `--point`를 읽게 하는 다리입니다. 보이는 화면의 `--point`는 `#f97316`입니다. `mono_bw`와 `soft_pastel`의 `.gm-pixel`은 숨겨져 있고, 그 안에서 `bg-point`를 계산하면 테마 `--point`(`#111`, `#f79f97`)가 됩니다. 칠해지는 픽셀은 픽셀 테마의 `#f97316`입니다. `bg-blush`도 테마 `--tint-blush`를 따릅니다. 보이는 픽셀 그림은 픽셀 테마 안이라 `#ffe4e6`입니다.

`text-purple`, `border-ink`, `bg-mint`는 기존 브랜드 유틸이라 `.pub-page` 안에서도 `:root` 색입니다. 모노 선 그림의 `#111`은 `border-ink`(`#171717`)가 아니라 `border-(--ink)`·`text-(--ink)`입니다. `mono_bw`의 `--ink`는 `#111`입니다.

필 클래스는 `.pub-pill`, `.pub-pill-alt`에서 `.theme-pill`, `.theme-pill-alt`로 이름을 바꿨습니다. 선언은 같고, `mono_bw` 헤더 예외는 `.pub-page[data-theme="mono_bw"] .pub-header .theme-pill`입니다. 호출은 [Badge](../../components/ui/badge.tsx)의 `theme`, `theme-alt`입니다. 관리자 상태 배지는 `status`·`status-dot`(tone `open`, `paused`, `fulfilled`, `hidden`)이고, 안 읽은 수는 `count`(`bg-point`)입니다. 숨김 글자와 점은 `text-zinc-600`, `bg-zinc-400`로 남겼습니다. 로그인·온보딩 주황 상자는 [Alert](../../components/ui/alert.tsx) `notice`(`border-2 border-point bg-warn-tint text-warn-ink`)입니다.

그대로 둔 hex: 설정 `#f9fafb`, 위시 썸네일 `#f4f4f3`, 안내 `#fafafa`, OG 이미지.

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

공개 테마 타이포는 의미 토큰이 값을 가집니다. 컴포넌트 규칙은 의미 이름을 직접 씁니다. 호출부가 없던 별칭은 제거했습니다. `--label-size`와 `--pill-size`는 세 테마가 같은 12px라 `.pub-page` 블록에만 적고, 다른 테마 블록은 덮어쓰지 않습니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- |
| `--headline-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` |
| `--headline-weight` | `700` | `900` | `800` |
| `--headline-size` | `36px` | `30px` | `30px` |
| `--headline-lh` | `1.4` | `1.18` | `1.3` |
| `--headline-ls` | `0` | `-1px` | `-0.4px` |
| `--label-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` |
| `--label-size` | `12px` | 같은 12px | 같은 12px |
| `--label-weight` | `700` | `700` | `700` |
| `--label-ls` | `0` | `1.6px` | `0.4px` |
| `--label-transform` | `none` | `uppercase` | `none` |
| `--pill-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` |
| `--pill-weight` | `700` | `700` | `700` |
| `--pill-transform` | `none` | `uppercase` | `none` |
| `--pill-size` | `12px` | 같은 12px | 같은 12px |
| `--btn-font` | `var(--font-display, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` | `var(--font-body, Arial, Helvetica, sans-serif)` |
| `--btn-weight` | `700` | `700` | `700` |
| `--btn-size` | `15px` | `14px` | `15px` |

`--label-size`와 `--pill-size`는 원래 별도 토큰이 아니라 당시 `.pub-label`·`.pub-pill`의 `12px`였습니다. 필 클래스는 지금 `.theme-pill`입니다. `--label-color`는 색이라 이 표에 없습니다. `.pub-eyebrow`의 `font-size: 12px`와 `text-transform: uppercase`도 토큰으로 바꾸지 않았습니다. 라벨 크기와 숫자가 같아도, 눈썹은 테마의 `--label-transform`을 쓰지 않습니다.

지운 타이포 별칭: `--pub-headline-font`, `--pub-headline-weight`, `--pub-headline-size`, `--pub-headline-lh`, `--pub-headline-ls`, `--pub-label-font`, `--pub-label-ls`, `--pub-label-transform`, `--pub-label-weight`, `--pub-pill-font`, `--pub-pill-weight`, `--pub-pill-transform`, `--pub-btn-font`, `--pub-btn-weight`, `--pub-btn-size`.

합치지 않은 가까운 값:

| 현재 | 그대로 둔 이유 |
| --- | --- |
| `.sticker-label`의 `font-size: 0.75rem` | 루트 16px에서 12px와 같아 보여도 단위가 다름. `--label-size`로 합치지 않음 |
| 토스트의 `font-size: 14px` | `text-sm`은 `0.875rem`에 행간을 붙임. px만 같음 |
| `components/ui`의 `text-[0.8rem]` | shadcn 기본값. 위 스케일에 넣지 않음 |
| 빈 선물 자리의 `tracking-[1.6px]` | 한 곳의 자간. `--label-ls`의 모노 값 `1.6px`와 숫자가 같아도 역할이 다름 |
| OG `fontSize` | 이미지 생성용 인라인 숫자. CSS 토큰이 아님 |

## 모서리·테두리·그림자

공개 테마의 모양 값은 의미 이름이 가집니다. 테마별 값은 그대로이고, 호출부가 없던 별칭은 제거했습니다. 진행률 트랙·높이·채움은 `--progress-track`, `--progress-h`, `--progress-fill`입니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- |
| `--card-border` | `2px solid #171717` | `1.5px solid #111` | `none` |
| `--card-radius` | `4px` | `0` | `22px` |
| `--card-shadow` | `6px 6px 0 #111827` | `none` | `0 10px 28px rgba(150, 120, 160, 0.16)` |
| `--card-shadow-sm` | `3px 3px 0 #111827` | `none` | `0 6px 16px rgba(150, 120, 160, 0.2)` |
| `--header-border` | `2px solid #171717` | `1.5px solid #111` | `none` |
| `--pill-border` | `2px solid #171717` | `1.5px solid #111` | `none` |
| `--pill-radius` | `0` | `0` | `999px` |
| `--pill-shadow` | `3px 3px 0 #111827` | `none` | `none` |
| `--btn-radius` | `4px` | `0` | `16px` |
| `--btn-border` | `2px solid #171717` | `1.5px solid #111` | `none` |
| `--btn-shadow` | `3px 3px 0 #111827` | `none` | `0 6px 16px rgba(150, 120, 160, 0.2)` |
| `--progress-border` | `2px solid #171717` | `1.5px solid #111` | `none` |
| `--progress-radius` | `2px` | `0` | `999px` |
| `--field-border` | `2px solid #171717` | `1.5px solid #111` | `1.5px solid #f0dfe9` |
| `--field-radius` | `4px` | `0` | `14px` |

지운 모양·간격 별칭: `--pub-border`, `--pub-radius`, `--pub-shadow`, `--pub-shadow-lg`, `--pub-shadow-sm`, `--pub-header-border`, `--pub-pill-border`, `--pub-pill-radius`, `--pub-pill-shadow`, `--pub-btn-radius`, `--pub-btn-border`, `--pub-btn-shadow`, `--pub-progress-border`, `--pub-progress-radius`, `--pub-field-border`, `--pub-field-radius`, `--pub-pill-pad`.

2026-11-14에 지운 토큰: `--card-shadow-lg`. `.pub-card-hero`를 지우면서 `var()`로 읽는 곳이 없어졌습니다.

고정 픽셀 그림자는 [globals.css](../../app/globals.css)의 `:root`와 `@theme inline`에 같은 리터럴로 있습니다. 유틸은 `@theme` 리터럴을 Tailwind 그림자 래퍼에 넣고, `.sticker-label`은 `:root` 변수를 `box-shadow`에 그대로 씁니다. `.pixel-board`와 `.pixel-card`는 호출부가 없어 2026-11-14에 지웠습니다.

2026-11-12에 `--shadow-pixel-xs`(`2px 2px 0 #111827`)를 추가했습니다. 홈의 픽셀 그림자와 `.sticker-label`이 이 값을 씁니다. 404·오류 카드의 `shadow-pixel-xs`도 같은 토큰입니다. 로그인·온보딩·관리자·공개 위시리스트의 기존 그림자는 그대로입니다.

| 유틸·변수 | 값 | 현재 사용 |
| --- | --- | --- |
| `shadow-pixel-xs` / `--shadow-pixel-xs` | `2px 2px 0 #111827` | 홈 미리보기·FAQ·선물 상자, 404·오류 카드, `.sticker-label` |
| `shadow-pixel-sm` / `--shadow-pixel-sm` | `3px 3px 0 #111827` | 관리자 첫 진입 안내 비네트 |
| `shadow-pixel-md` / `--shadow-pixel-md` | `4px 4px 0 #111827` | 공개 위시 헤더 장식, 약관 본문 |
| `shadow-pixel-lg` / `--shadow-pixel-lg` | `6px 6px 0 #111827` | 로그인·온보딩·약관 헤더 |
| `shadow-pixel-xl` / `--shadow-pixel-xl` | `8px 8px 0 #111827` | 현재 호출부는 없음. 토큰은 남겨 둠 |
| `shadow-header-line` / `--shadow-header-line` | `0 1px 0 rgba(24, 24, 27, 0.02)` | 관리자 헤더와 로딩 헤더 |

픽셀 테마의 `--card-shadow-sm`·`--pill-shadow`·`--btn-shadow`는 위 고정 그림자와 픽셀이 같아도 별도 토큰입니다. `mono_bw`는 `none`이고 `soft_pastel`은 흐린 그림자입니다.

`@theme`의 `--shadow-pub`와 `--radius-pub`는 지웠습니다. `--shadow-pub`는 [생일 선택](../../app/onboarding/birthday-picker.tsx)의 `shadow-pub` 한 곳뿐이었습니다. Tailwind 기본 `shadow-xs` 생성 문자열은 `0 1px 2px 0 var(--tw-shadow-color, rgb(0 0 0 / 0.05))`라 퍼짐 `0`과 색 문법이 다르지만, Chrome 계산 `box-shadow`는 dev·production 모두 마지막 층이 `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`로 같았습니다. 그래서 `shadow-xs`로 바꿨습니다. `--radius-pub`(`0.375rem`)와 `rounded-pub`는 사용처가 없습니다. `rounded-md`는 `--radius` `0.625rem`의 0.8배라 그 값과 다릅니다.

그대로 둔 모양:

| 현재 | 그대로 둔 이유 |
| --- | --- |
| 안내 창의 `shadow-[5px_5px_0_#111827]`, `sm:shadow-[7px_7px_0_#111827]` | 한 곳씩인 5px·7px |
| Tailwind 기본 `rounded-md`, `border-2`, `shadow-md` | 기본 스케일 |
| shadcn `rounded-[min(var(--radius-md),...)]` | 컴포넌트 기본 모서리 상한 |
| `--toast-*` | `.pub-page` 밖 토스트. 그림자에 `4px 4px 0 #111827`가 있어도 `shadow-pixel-md`로 합치지 않음 |
| `soft_pastel`의 `.theme-btn:not(.theme-btn-primary):not(.theme-btn-accent)` | `border: 1.5px solid #f0dfe9`, `box-shadow: none`. `--btn-border`는 `none` |
| `mono_bw` 헤더 필 `1.5px solid rgba(255,255,255,0.6)`, 지표 `1.5px solid rgba(255,255,255,0.5)` | 테마 `--pill-border`·`--card-border`와 다른 반투명 선 |

## 간격

필 안쪽 여백은 테마마다 다르고, 버튼 여백·필 간격·버튼 간격은 세 테마가 같은 공유 블록에 있습니다. `--pill-pad` 별칭은 제거했습니다.

| 의미 토큰 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- |
| `--pill-pad` | `7px 10px 6px` | `6px 10px` | `7px 12px` |
| `--btn-pad` | `15px 18px` | 같은 값 | 같은 값 |
| `--btn-gap` | `8px` | 같은 값 | 같은 값 |
| `--pill-gap` | `6px` | 같은 값 | 같은 값 |

`--btn-pad`, `--btn-gap`, `--pill-gap`는 원래 별도 토큰이 아니라 `.theme-btn`·`.theme-pill`의 값입니다. 공개 버튼 클래스는 `.theme-btn`, `.theme-btn-primary`, `.theme-btn-accent`이고, 호출은 [Button](../../components/ui/button.tsx) variant입니다. 너비 100%는 `size="block"`(`w-full`)입니다.

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

## 접두사만 뺀 역할 토큰

값을 직접 갖고 있던 이름은 `pub-`만 뺐습니다. 세 테마 리터럴은 그대로입니다. `--stat-accent`와 `--msg-sub`는 세 테마에 선언되어 있지만 규칙을 읽는 곳이 없습니다. 삭제 여부는 정하지 않아 이름을 바꾼 채 남겨 둡니다.

| 이전 | 현재 | `pixel_y2k` | `mono_bw` | `soft_pastel` |
| --- | --- | --- | --- | --- |
| `--pub-bg-dots` | `--bg-dots` | `radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)` | `none` | `none` |
| `--pub-dot-size` | `--dot-size` | `18px` | `0` | `0` |
| `--pub-header-dots` | `--header-dots` | `radial-gradient(rgba(23, 23, 23, 0.1) 1.4px, transparent 1.4px)` | `none` | `none` |
| `--pub-header-sub` | `--header-sub` | `#0f766e` | `rgba(255, 255, 255, 0.6)` | `#7fb8ab` |
| `--pub-label-color` | `--label-color` | `#0f766e` | `#9a9a9a` | `#bd6595` |
| `--pub-stat-accent` | `--stat-accent` | `#0f766e` | `#fff` | `#7fb8ab` |
| `--pub-on-point` | `--on-point` | `#fff` | `#fff` | `#fff` |
| `--pub-divider-color` | `--divider-color` | `#171717` | `#111` | `#f0dfe9` |
| `--pub-pill-bg` | `--pill-bg` | `#f97316` | `transparent` | `#ffe1ec` |
| `--pub-pill-color` | `--pill-color` | `#fff` | `#111` | `#bd6595` |
| `--pub-pill-alt-bg` | `--pill-alt-bg` | `#ccfbf1` | `#111` | `#dff1ec` |
| `--pub-pill-alt-color` | `--pill-alt-color` | `#171717` | `#fff` | `#3f7a6e` |
| `--pub-progress-track` | `--progress-track` | `#fff` | `#ededed` | `#f1eaf6` |
| `--pub-progress-fill` | `--progress-fill` | `#0f766e` | `#111` | `#7fb8ab` |
| `--pub-progress-h` | `--progress-h` | `18px` | `12px` | `10px` |
| `--pub-field-bg` | `--field-bg` | `#fff` | `#fff` | `#fffafc` |
| `--pub-bank-bg` | `--bank-bg` | `#ccfbf1` | `#f6f6f6` | `#dff1ec` |
| `--pub-bank-ink` | `--bank-ink` | `#134e4a` | `#333` | `#3f7a6e` |
| `--pub-msg-sub` | `--msg-sub` | `#9d174d` | `#6b6b6b` | `#c77ba0` |

2026-11-14에 지운 토큰: `--msg-title`(이전 `--pub-msg-title`). `.pub-msg-title`을 지우면서 `var()`로 읽는 곳이 없어졌습니다.

`--toast-*`는 의미 토큰으로 바꾸지 않습니다. 토스트는 `.pub-page` 밖이라 `body:has(...)`의 리터럴을 유지합니다. `soft_pastel`은 warning·info를 적지 않아 브랜드 폴백(`--brand-orange`, `--brand-purple`)을 씁니다.

`pixel_y2k`에서만 값이 같은 것들은 코어 색으로 합치지 않습니다. 다른 테마에서 갈라지기 때문입니다.

| `pixel_y2k`에서 코어 색과 같음 | 다른 테마 |
| --- | --- |
| `--header-sub`, `--label-color`, `--stat-accent`는 `--accent-main`(`#0f766e`)과 같음 | `mono_bw`는 각각 `rgba(255, 255, 255, 0.6)`, `#9a9a9a`, `#fff`. `soft_pastel`의 `--label-color`는 `#bd6595` |
| `--pill-bg`는 `--point`와 같음 | `mono_bw`는 `transparent`, `soft_pastel`은 `#ffe1ec` |
| `--pill-alt-bg`, `--bank-bg`는 `--tint-mint`와 같음 | `mono_bw`는 `#111`, `#f6f6f6`. `soft_pastel`은 둘 다 `#dff1ec`이고 fallback `#fdeef5`와 다름 |

`--progress-fill`은 현재 세 테마 모두 `--accent-main`과 같은 값입니다. 진행률 전용으로 남겨 두었고, `--accent-main`으로 합치지 않았습니다.

선물 없음 자리의 `GIFT` 그림은 `.gm-pixel`, `.gm-line`, `.gm-soft`입니다. 2026-11-14에 픽셀 그림은 `border-ink`·`bg-point`·`bg-blush`·`bg-mint`·`bg-yellow`·`text-purple`, 모노 선은 `border-(--ink)`·`text-(--ink)`, 파스텔 둥근 그림은 `bg-(--gift-soft-bg)`·`text-(--gift-soft-ink)`입니다.

## 확인 방법

[별칭 계약](../../src/lib/design/semantic-token-alias.test.ts)은 `:root` 브랜드 별칭, 세 테마 토큰의 기존 리터럴, 카드의 `--headline: var(--ink)`, 고정 픽셀 그림자와 관리자 사이드바 테마 키, 그리고 `app/`·`components/`·`src/`와 공개 테마 CSS에 `pub-` 접두사 커스텀 속성이 없는지를 봅니다. `--stat-accent`와 `--msg-sub`는 선언만 있는지도 봅니다. 2026-11-14에 지운 `--card-shadow-lg`와 `--msg-title`은 공개 테마 CSS에 선언이 없는지도 봅니다. 이 비교는 브라우저 계산값을 대신하지 않습니다.

[Tailwind 유틸 계약](../../src/lib/design/tailwind-brand-utility.test.ts)은 `@tailwindcss/postcss` 4.3으로 `app/globals.css`를 dev·production 두 방식으로 컴파일합니다. `.text-purple` 등이 `var(--brand-*)`를 참조하는지, 의미 토큰 유틸이 `var(--headline)`처럼 테마 변수를 그대로 두는지, 생성 CSS에 `pub-` 접두사 커스텀 속성이 없는지를 확인합니다. `text-micro` 등은 `font-size`만 갖고, `text-sm`·`text-base` 기본 스케일은 행간을 유지하는지도 봅니다. `shadow-pixel-*`와 `shadow-header-line`은 예전 임의 유틸과 같은 Tailwind 그림자 래퍼이고, `shadow-md`는 그대로인지도 봅니다. `shadow-xs`의 Chrome 계산 `box-shadow`는 지운 `--shadow-pub`와 같은 `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`입니다. `--radius-pub`는 사용처가 없어 지웠고, `rounded-md`는 `--radius` `0.625rem`의 0.8배라 `0.375rem`과 다릅니다. `w-admin-sidebar`는 `220px`, `py-admin-sidebar`는 `22px`인지도 봅니다. Chrome이 있으면 그 CSS를 세 테마와 테마 없는 기본 `.pub-page`에 적용해 계산색, 글꼴·글자 크기·굵기·행간·자간, 카드·필·버튼·진행률·필드의 테두리·모서리·그림자, 필·버튼의 여백과 간격, 필·필드·계좌·진행률의 색과 높이를 확인합니다. 카드 제목은 잉크, 헤더 제목과 헤더 지표는 테마 헤드라인, 브랜드 유틸과 상속된 `--brand-purple`은 `#4c1d95`인지 봅니다. 토스트는 테마 리터럴과 브랜드 폴백을 구분합니다.

[관리자 테마 계약](../../src/lib/design/admin-theme-contract.test.ts)은 `--color-*` 다리가 `--brand-*`를 가리키는지 확인합니다. 2026-11-06에 개발 서버의 홈과 `/sample?theme=` 세 테마를 Chrome 계산색으로 따로 대조했습니다. 그 확인은 위 테스트 계약을 대신하지 않고, 관리자 로그인 화면은 열지 않았습니다.

[필·알림 계약](../../src/lib/design/badge-contract.test.ts)은 Badge `theme`·`status`·`count`와 Alert `notice`에 hex가 없는지, `.pub-pill`이 없는지, 설정·썸네일·안내·OG를 뺀 `.tsx`에 `[#hex]`와 `"#hex"`가 없는지를 봅니다. 2026-11-14 Tailwind 유틸 계약은 새 상태 유틸과 꽃가루 `:root` 리터럴, `bg-point`·`bg-blush`·`bg-yellow`의 테마 계산색, `soft_pastel`의 `--gift-soft-*`도 봅니다.
