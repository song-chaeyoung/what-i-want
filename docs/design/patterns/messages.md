# 메시지함

코드 대조일: 2026-11-18 (`main` @ `6bc5ea2`). 숨김·복구 토스트 문구 대조일: 2026-11-21.

[디자인 가이드](../README.md) · [기초 규칙](../foundations.md) · [폼](form.md) · [피드백](feedback.md) · [위시 카드](wish-card.md) · [온보딩](onboarding.md) · [공유 흐름](share-flow.md)

이 문서는 친구가 공개 페이지에서 보낸 메시지·마음이 생일자의 관리자 메시지함에 도착하고 정리되는 흐름의 기존 표현을 재사용하기 위한 안내입니다. 입력 폼과 결과 안내의 세부는 [폼](form.md)·[피드백](feedback.md)에 있으므로 여기서는 두 화면을 잇는 부분만 다룹니다. 이번 작성은 정적 코드 대조이며 화면·테스트를 새로 실행한 기록은 아닙니다.

## 사용 상황

- 친구는 로그인 없이 공개 페이지에서 메시지만 남기거나, 선물 카드에서 금액과 함께 메시지를 남깁니다. 두 경우 모두 같은 `messages` 기록이 되고, 금액이 있는 경우에만 참여 기록(`funding_logs`)이 함께 생깁니다.
- 생일자는 `/admin/messages`에서 받은 메시지와 숨긴 메시지를 나눠 봅니다.
- 공개 화면에는 받은 메시지 목록이 없습니다. 메시지는 생일자만 봅니다.

근거: [공개 뷰](../../../components/public-wishlist-view.tsx), [참여 서비스](../../../src/lib/public-participation/service.ts), [메시지함](../../../app/admin/messages/page.tsx).

## 현재 구현과 근거

### 공개에서 보내는 쪽

- 메시지만 보내는 폼은 접힌 `details`(`축하 메시지 남기기`, `결제 없이 메시지만 전할 수 있어요.`)이고, 선물별 참여 폼도 접힌 `details`(`이 선물에 마음 보태기`)입니다. 선물별 폼은 저장된 상태가 `open`이고 완료되지 않은 카드에만 나옵니다. 두 폼 모두 이름(선택·80자), 메시지(필수·500자), 숨김 `clientRequestId`를 보냅니다. 선물별 폼은 금액과 `wishItemId`가 더 있습니다. 제출 방식과 결과 토스트는 [폼 패턴](form.md)·[피드백 패턴](feedback.md)을 따릅니다.
- 제출은 [Server Action](../../../app/wishlist/[slug]/actions.ts)이 받습니다. 같은 공개 주소·방문자의 요청이 60초에 5번을 넘으면 `rate_limited`로 돌려보냅니다. 이 제한은 서버 한 프로세스의 메모리 기준입니다. 근거: [rate-limit](../../../src/lib/public-participation/rate-limit.ts).
- 같은 `clientRequestId`는 한 번만 저장되고, 내용이 다른 재사용은 `client_request_conflict`입니다. 선물별 참여는 저장 시점에 선물이 `open`일 때만 모인 금액에 더해집니다. 근거: [참여 저장](../../../src/lib/public-participation/repository.ts).
- 공개 문구와 오류 문구는 [copy.ts](../../../src/lib/design/copy.ts)의 `PUBLIC_WISHLIST_COPY`에 있습니다.

### 관리자 메시지함

- 위에서부터 지표(`받은 메시지` 또는 `숨긴 메시지`, `N개`), 탭 `받은 메시지`·`숨긴 메시지`(`nav` `aria-label="메시지 필터"`), 목록입니다. 목록은 `Card variant="admin"`과 `divide-y`이고 최신순이며 페이지 나눔이나 개수 제한이 없습니다.
- 한 줄은 선물 이름 칩(메시지만이면 `선물 없음`), KST 시각, 이름(없으면 `익명`), 본문, 금액(없으면 `금액 없음`), 버튼입니다. 본문은 전체를 보여 줍니다. `whitespace-pre-wrap`로 줄바꿈을 유지하고, `wrap-break-word`로 긴 단어는 끊습니다. 근거: [메시지함](../../../app/admin/messages/page.tsx), [UI 계약](../../../src/lib/admin-messages/ui-contract.test.ts).
- 빈 상태 문구와 다음 행동은 [피드백 패턴](feedback.md)의 빈 상태에 있습니다.

### 안 읽음 표시

- 사이드바·모바일 탭의 `메시지함`에 Badge `count`가 붙습니다. 100개 이상은 `99+`이고 `aria-label`은 `새 메시지 N개`입니다.
- 받은 메시지함을 열면 목록을 읽기 직전 시각까지를 읽음으로 기록합니다. 그사이 도착한 메시지는 안 읽음으로 남습니다. 숨긴 메시지함은 읽음 처리하지 않습니다. 근거: [네비](../../../app/admin/admin-shell-nav.tsx), [읽음 계약](../../../src/lib/admin-messages/navigation.test.ts), [저장소](../../../src/lib/admin-messages/repository.ts).

### 숨기기와 복구

- `숨기기`는 [확인창](confirm-dialog.md)으로 묻습니다. 여는 버튼은 `subtle`, 확인 버튼은 `admin`입니다. 금액이 있으면 모인 금액에서 빠지고 복구할 수 있다고 알립니다. `숨김 해제`는 확인 없이 바로 복구합니다. 근거: [HideMessageForm](../../../app/admin/messages/hide-message-form.tsx).
- 확인창, 안내, 토스트는 모두 '메시지'라고 부릅니다. '참여 기록'은 화면에 쓰지 않습니다.
- [메시지 route](../../../app/api/admin/messages/[id]/route.ts)가 `intent`(`hide`·`unhide`)를 받아 처리하고 `?messageHidden=1`, `?messageRestored=1`, 실패는 `?error=1`로 돌려보냅니다. [관리자 토스트](../../../app/admin/admin-toast-events.tsx)가 `메시지를 숨겼어요.`, `메시지를 복구했어요.`, `요청을 처리하지 못했어요.`를 보여 줍니다.
- 숨김·복구 때 참여 기록은 지우지 않고 선물의 모인 금액만 빼거나 더합니다(0 아래로는 내려가지 않음). 처리 후 공개 페이지 캐시를 갱신합니다.

## 작업 시 유지할 규칙

1. 메시지만 보낸 기록과 금액 참여 기록을 같은 목록에서 구분해 보여 줍니다(`선물 없음`·`금액 없음`). 근거: 위 목록 구성.
2. 받은 메시지함에서만 읽음 처리합니다. 숨긴 메시지함을 열었다고 새 메시지를 읽은 것으로 바꾸지 않습니다. 근거: [읽음 계약](../../../src/lib/admin-messages/ui-contract.test.ts).
3. 금액이 있는 기록을 숨길 때는 모인 금액이 바뀐다는 안내를 유지합니다. 근거: [HideMessageForm](../../../app/admin/messages/hide-message-form.tsx), [피드백 규칙 3](feedback.md).
4. 숨김·복구는 서버가 소유자의 위시리스트인지 확인한 뒤 처리합니다. 화면의 버튼 유무로 권한을 대신하지 않습니다. 근거: [서비스](../../../src/lib/admin-messages/service.ts), [교차 계정 거절 테스트](../../../tests/admin/cross-account-message-rejected.spec.ts).
5. 이름이 없으면 `익명`입니다. 본문은 줄바꿈을 유지하고 긴 단어는 `wrap-break-word`로 끊으며 전체를 보여 줍니다. 근거: [메시지함](../../../app/admin/messages/page.tsx).

## 차이와 미결정

- **개수 제한:** 메시지가 많아져도 페이지 나눔이나 더 보기가 없습니다. 어느 규모에서 필요한지 정하지 않았습니다.
- **확인 방식:** `숨기기`는 확인창이 있고 `숨김 해제`는 없습니다. 의도된 차이인지 문서화된 결정은 찾지 못했습니다.
- **확인창:** `숨기기`는 [확인창](confirm-dialog.md)을 쓰고 `숨김 해제`는 확인 없이 복구합니다(2026-11-24).
- **오류 안내:** 숨김·복구 실패는 원인과 관계없이 일반 토스트 하나입니다.
- **저장 이름:** 공개 입력이 80자를 넘으면 서버가 앞 80자만 저장합니다(오류로 알리지 않음).

## 확인 방법

- 소스 연결: [메시지함 UI 계약](../../../src/lib/admin-messages/ui-contract.test.ts), [읽음 네비](../../../src/lib/admin-messages/navigation.test.ts), [서비스](../../../src/lib/admin-messages/service.test.ts), [저장소](../../../src/lib/admin-messages/repository.test.ts), [공개 참여 UI 계약](../../../src/lib/public-participation/ui-contract.test.ts).
- 브라우저(관리자): [숨김·복구](../../../tests/admin/hide-and-restore-message.spec.ts), [숨김 취소](../../../tests/admin/cancel-hide-message.spec.ts), [필터](../../../tests/admin/message-filters.spec.ts), [안 읽음 배지](../../../tests/admin/unread-message-badge.spec.ts).
- 브라우저(공개): [메시지 보내기](../../../tests/wishlist/send-message.spec.ts), [공백 메시지](../../../tests/wishlist/message-whitespace-rejected.spec.ts), [전송 횟수 제한](../../../tests/wishlist/submission-rate-limit.spec.ts).
- 화면: 관리자 메시지함은 320·390·1440px에서 긴 이름·긴 본문·금액 유무·0건·숨긴 목록을 봅니다. 공개 폼은 세 테마(`pixel_y2k`, `mono_bw`, `soft_pastel`)에서 확인합니다.

이 문서 작성 시 위 테스트와 화면은 실행하지 않았습니다. 명령은 [package.json](../../../package.json)의 `pnpm test`, `pnpm test:e2e`를 사용합니다.
