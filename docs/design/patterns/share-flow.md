# 공유 흐름

코드 대조일: 2026-11-18 (`main` @ `6bc5ea2`). 로그인 버튼 변형·관리자 홈 공유 테스트 대조일: 2026-11-21.

[디자인 가이드](../README.md) · [기초 규칙](../foundations.md) · [폼](form.md) · [피드백](feedback.md) · [위시 카드](wish-card.md) · [온보딩](onboarding.md) · [메시지함](messages.md)

이 문서는 생일자와 친구가 위시리스트 링크를 공유하는 버튼, 공유 링크의 형태, 링크 미리보기(OG 이미지)의 기존 표현을 재사용하기 위한 안내입니다. 결과 토스트의 일반 규칙은 [피드백 패턴](feedback.md)에 있습니다. 이번 작성은 정적 코드 대조이며 실제 공유 시트·카카오톡 미리보기를 확인한 기록은 아닙니다.

## 사용 상황

- 생일자는 관리자 홈의 `내 공개 주소` 카드에서 공유합니다. 첫 진입 안내의 3단계도 링크 공유를 안내합니다.
- 친구는 공개 페이지·샘플 헤더의 `공유하기`로 다시 공유합니다.
- 친구가 참여를 마치면 `나도 만들기`로 로그인 화면에 연결됩니다.
- 링크를 받은 사람은 메신저나 SNS의 링크 미리보기를 먼저 봅니다.

근거: [관리자 홈](../../../app/admin/page.tsx), [공유 버튼(관리자)](../../../app/admin/share-public-link-button.tsx), [공유 버튼(공개)](../../../components/public-share-button.tsx), [안내 Dialog](../../../app/admin/admin-guide-dialog.tsx), [공개 토스트](../../../components/public-wishlist-toast-events.tsx).

## 현재 구현과 근거

### 공유 동작

관리자와 공개 버튼은 같은 훅 [useWishlistShare](../../../components/use-wishlist-share.ts)를 씁니다.

- 브라우저가 `navigator.share`를 지원하면 공유 시트를 엽니다. 성공하면 토스트도 라벨 변경도 없습니다. 사용자가 시트를 닫으면(`AbortError`) 아무것도 하지 않습니다.
- 지원하지 않거나 다른 이유로 실패하면 클립보드에 복사합니다. 성공하면 버튼 라벨이 2초 동안 `복사 완료`가 되고 토스트 `위시리스트 링크를 복사했어요.`가 나옵니다. 실패하면 오류 토스트 `링크 복사에 실패했어요. 주소를 직접 복사해주세요.`가 나오고 라벨은 그대로입니다.
- 문구는 [copy.ts](../../../src/lib/design/copy.ts)의 `shareCta`·`shareCopied`·`shareSuccess`·`shareError`입니다.

### 버튼 표현

- 관리자: Button `admin-outline`에 `Share2` 아이콘이고, 복사 후에는 teal `Check`로 바뀝니다. 같은 카드에 `열어 보기`가 있습니다. 위시리스트가 비공개면 주소 아래에 `비공개라 친구가 열 수 없어요.`가 보이지만 버튼은 그대로 동작합니다.
- 공개·샘플: 헤더 오른쪽의 Button `theme`이며 선택 테마의 모양을 따릅니다.
- `kakao`·`google` 변형은 공유 버튼이 아니라 [로그인](../../../app/login/page.tsx)의 `Kakao로 계속하기`·`Google로 계속하기`에서만 씁니다. `kakao`는 노란 면, `google`은 흰 면입니다. 카카오 전용 공유 SDK는 없고, 카카오톡은 기기 공유 시트에서 고르는 경로입니다.

### 링크 형태

[share-url.ts](../../../src/lib/share/share-url.ts)가 만듭니다.

- 실제 위시리스트: `/wishlist/{slug}?utm_source=owner_share|visitor_share&utm_medium=share`. 관리자 버튼은 `owner`, 공개 버튼은 `visitor`입니다.
- 샘플: `/sample?theme={테마}&utm_source=visitor_share&utm_medium=share`. 선택한 테마가 유지됩니다.
- 참여 직후 `나도 만들기`: `/login?utm_source=post_participation&utm_medium=cta`. 메시지만 보내면 토스트 액션으로, 금액 참여 후에는 계좌 안내 모달의 버튼으로 나옵니다. 계좌가 없으면 토스트 액션입니다.
- 네이티브 공유의 제목은 관리자가 `뭐갖고싶어 생일 위시리스트`, 공개가 위시리스트 제목입니다.

### 링크 미리보기

- 서비스 공통: [app/opengraph-image.tsx](../../../app/opengraph-image.tsx)가 1200×630 이미지를 만듭니다. 홈과 샘플이 이 이미지를 씁니다.
- 위시리스트별: [OG 이미지](../../../app/wishlist/[slug]/opengraph-image.tsx)는 제목, 선물 개수, 모인 마음, 앞 3개 선물 이름을 보여 줍니다. 찾을 수 없는 주소는 `위시리스트를 찾을 수 없어요` 이미지가 나옵니다.
- 두 이미지는 고정 스타일이라 사용자가 고른 공개 테마를 따르지 않습니다. 근거: [기초 규칙](../foundations.md), [OG 계약](../../../src/lib/design/og-image-contract.test.ts).
- 위시리스트 페이지의 메타데이터는 제목, 고정 설명, `summary_large_image`이고 검색 노출은 막혀 있습니다(`noindex`). 샘플도 `summary_large_image`이지만 검색 노출은 열려 있습니다(`index: true`). 근거: [공개 페이지](../../../app/wishlist/[slug]/page.tsx), [샘플](../../../app/sample/page.tsx).

## 작업 시 유지할 규칙

1. 새 공유 진입점은 [useWishlistShare](../../../components/use-wishlist-share.ts)를 쓰고 네이티브 공유 → 클립보드 복사 순서와 취소 시 무반응을 유지합니다. 근거: [네이티브 공유 경로 테스트](../../../tests/sample/native-share-paths.spec.ts).
2. 공유 링크에는 `source`에 따른 UTM을 붙이고, 샘플 공유는 `/sample`과 선택 테마를 유지합니다. 근거: [share-url 테스트](../../../src/lib/share/share-url.test.ts).
3. 복사 성공과 실패는 라벨과 토스트로 구분합니다. 실패 때 성공 라벨로 바꾸지 않습니다. 근거: [클립보드 실패 토스트 테스트](../../../tests/sample/clipboard-failure-toasts.spec.ts).
4. 비공개 위시리스트 안내는 관리자 공유 버튼 옆에 둡니다. 근거: [비공개 안내 계약](../../../src/lib/design/private-share-notice.test.ts).
5. 참여 직후 `나도 만들기`는 토스트 액션이나 계좌 모달 중 한 곳에만 둡니다. 근거: [공개 토스트](../../../components/public-wishlist-toast-events.tsx).

## 차이와 미결정

- **성공 피드백:** 클립보드 복사에는 라벨과 토스트가 있고, 네이티브 공유 성공에는 아무 표시가 없습니다. 의도된 차이로 테스트가 고정하고 있지만, 사용자에게 충분한지는 확인하지 않았습니다.
- **아이콘:** 관리자 버튼에는 아이콘이 있고 공개 버튼에는 없습니다.
- **OG 테마:** OG 이미지가 테마를 따르지 않습니다. 연동 여부는 [기초 규칙](../foundations.md)대로 정하지 않았습니다.
- **OG 긴 제목:** 위시리스트별 OG의 제목·선물 이름은 `keep-all`만 있고 줄 수 제한이나 말줄임 처리를 찾지 못했습니다. 긴 이름에서 어떻게 보이는지는 확인하지 않았습니다.
- **공유 문구:** 네이티브 공유에는 `title`과 `url`만 넘기고 본문 문구는 없습니다.

## 확인 방법

- 소스 연결: [share-url](../../../src/lib/share/share-url.test.ts), [비공개 안내](../../../src/lib/design/private-share-notice.test.ts), [OG](../../../src/lib/design/og-image-contract.test.ts), [메타데이터](../../../src/lib/design/seo-metadata-contract.test.ts), [공개 결과 계약](../../../src/lib/public-participation/ui-contract.test.ts).
- 브라우저(`/sample`): [링크 복사](../../../tests/sample/share-link-copy.spec.ts), [네이티브 공유 경로](../../../tests/sample/native-share-paths.spec.ts), [클립보드 실패](../../../tests/sample/clipboard-failure-toasts.spec.ts). 샘플의 공유 URL과 라벨·토스트를 확인합니다.
- 브라우저(`/admin`): [링크 복사](../../../tests/admin/share-link-copy.spec.ts), [네이티브 공유 경로](../../../tests/admin/native-share-paths.spec.ts). 관리자 홈 버튼의 복사·네이티브 공유 스텁을 확인하며, 기기의 실제 공유 시트는 확인하지 않습니다.
- 화면: 관리자 홈은 320·390·1440px에서 공유 버튼이 주소 카드 안에서 줄바꿈되는지, 공개 헤더는 세 테마에서 `공유하기`와 `복사 완료`의 폭을 봅니다. OG는 개발 서버에서 `/opengraph-image`, `/wishlist/{slug}/opengraph-image`를 열어 긴 제목·선물 0개를 확인합니다. 실제 메신저 미리보기는 별도로 확인합니다.

이 문서 작성 시 위 테스트와 화면은 실행하지 않았습니다. 명령은 [package.json](../../../package.json)의 `pnpm test`, `pnpm test:e2e`를 사용합니다.
