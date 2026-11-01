// 스크린샷 시드와 Playwright가 함께 읽는 카탈로그.
// Node로 직접 로드되므로 경로 별칭(@/)은 쓰지 않는다.

export const SCREENSHOT_FIXED_AT = "2026-06-15T03:00:00.000Z";
export const SCREENSHOT_FIXED_LABEL = "2026-06-15 12:00:00 KST";
export const SCREENSHOT_KST_DATE = "2026-06-15";
export const SEEDED_AT = "2026-06-01T03:00:00.000Z";
export const SESSION_EXPIRES_AT = "2099-01-01T00:00:00.000Z";

export const SCREENSHOT_PORT = 3210;
export const BASE_URL = `http://localhost:${SCREENSHOT_PORT}`;
export const SCREENSHOT_DIR = "docs/design/screenshots";
export const DATABASE_URL_DEFAULT =
  "postgres://postgres:postgres@127.0.0.1:5432/mwagotgo";

export const SCREENSHOT_AUTH_SECRET = "screenshot-auth-secret-do-not-use-in-prod";
export const SCREENSHOT_ACCOUNT_ENCRYPTION_SECRET =
  "screenshot-account-encryption-secret";
export const LEGAL_OPERATOR_NAME = "뭐갖고싶어";
export const LEGAL_OPERATOR_CONTACT = "privacy@example.test";

export const COOKIE_NAME = "authjs.session-token";
export const ADMIN_GUIDE_STORAGE_KEY = "mwagotgo:admin-guide-seen";
export const EMAIL_DOMAIN = "@screenshots.local";

export const BIRTHDAYS = {
  before: "1996-06-20",
  today: "1996-06-15",
  after: "1996-06-10",
} as const;

export const BIRTHDAY_BADGE = {
  before: "6월 20일 · D-5",
  today: "6월 15일 · D-DAY",
  after: "6월 10일 · D-360",
} as const;

export const SAMPLE_BIRTHDAY_BADGE = "5월 15일 · D-334";

export const THEMES = ["pixel_y2k", "mono_bw", "soft_pastel"] as const;
export type ThemeId = (typeof THEMES)[number];

export const WIDTHS = [375, 1280] as const;
export type ShotWidth = (typeof WIDTHS)[number];

export const PUBLIC_STATES = [
  "empty",
  "mixed",
  "birthday-before",
  "birthday-today",
  "birthday-after",
  "messages-none",
] as const;
export type PublicState = (typeof PUBLIC_STATES)[number];

export const WISH_STATUSES = ["open", "fulfilled", "paused", "hidden"] as const;
export type WishStatus = (typeof WISH_STATUSES)[number];

export const VISIBLE_MESSAGE_COUNT = 22;

export const LONG_GIFT_TITLE =
  "한정판 크림색 노이즈캔슬링 무선 헤드폰을 매일 출퇴근길과 주말 여행, 집에서 늦게 작업할 때도 쓰고 싶어서 올해 생일 선물로 오래 고민해 고른 물건입니다. 색은 크림이면 좋겠어요";

export const LONG_MESSAGE =
  "생일 축하해. 올해는 멀리 있어도 마음이 잘 닿았으면 좋겠어. 네가 오래 갖고 싶다고 말하던 선물이 모이면, 함께 열어보는 날을 손꼽아 기다릴게. 평소에 전하지 못한 고마움도 이 메시지에 담아 둔다. 건강하고 따뜻한 한 해가 되었으면 해. 우리 다음에도 이렇게 서로의 작은 소원을 기억하자. 네가 웃는 얼굴로 그 선물을 받는 장면을 상상하니 이미 즐겁다. 부족한 문장이지만 진심만은 분명히 전해지길 바라.";

export const THEME_LABEL: Record<ThemeId, string> = {
  pixel_y2k: "픽셀 Y2K",
  mono_bw: "모노 흑백",
  soft_pastel: "소프트 파스텔",
};

const THEME_SLUG: Record<ThemeId, string> = {
  pixel_y2k: "y2k",
  mono_bw: "mono",
  soft_pastel: "pastel",
};

const STATE_SLUG: Record<PublicState, string> = {
  empty: "empty",
  mixed: "mixed",
  "birthday-before": "before",
  "birthday-today": "today",
  "birthday-after": "after",
  "messages-none": "quiet",
};

export const SESSION_BY_NAME = {
  admin: "screenshot-admin-session",
  empty: "screenshot-empty-session",
  quiet: "screenshot-quiet-session",
  onboarding: "screenshot-onboarding-session",
} as const;

export type SessionName = keyof typeof SESSION_BY_NAME;

export function fixtureUuid(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffffff) {
    throw new Error(`fixture id out of range: ${n}`);
  }

  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

export const ADMIN_USER_ID = fixtureUuid(1);

export function publicSlug(theme: ThemeId, state: PublicState): string {
  return `shot-${THEME_SLUG[theme]}-${STATE_SLUG[state]}`;
}

export function screenshotName(
  screen: string,
  theme: string,
  width: number,
  state: string,
): string {
  return `${screen}-${theme}-${width}-${state}.png`;
}

export function resolveDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  const url = env.DATABASE_URL?.trim() || DATABASE_URL_DEFAULT;
  const host = new URL(url).hostname;

  if (host !== "localhost" && host !== "127.0.0.1" && host !== "::1") {
    throw new Error(
      `스크린샷 시드는 로컬 Postgres에서만 실행할 수 있습니다. 현재 호스트: ${host}`,
    );
  }

  return url;
}

export function screenshotServerEnv(
  databaseUrl: string,
): Record<string, string> {
  return {
    AUTH_SECRET: SCREENSHOT_AUTH_SECRET,
    AUTH_URL: BASE_URL,
    AUTH_TRUST_HOST: "true",
    ACCOUNT_ENCRYPTION_SECRET: SCREENSHOT_ACCOUNT_ENCRYPTION_SECRET,
    AUTH_GOOGLE_ID: "screenshot-google-id",
    AUTH_GOOGLE_SECRET: "screenshot-google-secret",
    AUTH_KAKAO_ID: "screenshot-kakao-id",
    AUTH_KAKAO_SECRET: "screenshot-kakao-secret",
    DATABASE_URL: databaseUrl,
    DATABASE_DIRECT_URL: databaseUrl,
    SUPPORT_URL: "",
    LEGAL_OPERATOR_NAME,
    LEGAL_OPERATOR_CONTACT,
    TZ: "UTC",
  };
}

export type SeedWish = {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  fundedAmount: number;
  status: WishStatus;
  productUrl: string | null;
  imageUrl: null;
  sortOrder: number;
};

export type SeedMessage = {
  id: string;
  wishItemId: string | null;
  senderName: string | null;
  body: string;
  amount: number | null;
  isHidden: boolean;
  createdAt: string;
  clientRequestId: string;
};

export type SeedUser = {
  id: string;
  email: string;
  name: string;
  sessionToken: string | null;
  role: string;
  profile: {
    id: string;
    displayName: string;
    birthday: string | null;
    description: string;
  } | null;
  wishlist: {
    id: string;
    slug: string;
    title: string;
    themeId: ThemeId;
  } | null;
  bankId: string | null;
  wishes: SeedWish[];
  messages: SeedMessage[];
};

type WishDraft = Omit<SeedWish, "id">;

const MIXED_WISHES: WishDraft[] = [
  {
    title: LONG_GIFT_TITLE,
    description: "이미지가 없는 선물이에요. 진행률은 0%입니다.",
    targetAmount: 45_000,
    fundedAmount: 0,
    status: "open",
    productUrl: null,
    imageUrl: null,
    sortOrder: 0,
  },
  {
    title: "진행률 50% 머그",
    description: "목표의 절반이 모였어요.",
    targetAmount: 20_000,
    fundedAmount: 10_000,
    status: "open",
    productUrl: "https://example.com/screenshot-gift",
    imageUrl: null,
    sortOrder: 1,
  },
  {
    title: "진행률 100% 키보드",
    description: "목표 금액을 모두 채웠어요.",
    targetAmount: 12_000,
    fundedAmount: 12_000,
    status: "open",
    productUrl: null,
    imageUrl: null,
    sortOrder: 2,
  },
  {
    title: "완료된 케이크",
    description: "이미 받은 선물로 표시해요.",
    targetAmount: 30_000,
    fundedAmount: 30_000,
    status: "fulfilled",
    productUrl: null,
    imageUrl: null,
    sortOrder: 3,
  },
  {
    title: "잠시 멈춘 향수",
    description: "지금은 마음을 받지 않아요.",
    targetAmount: 20_000,
    fundedAmount: 4_000,
    status: "paused",
    productUrl: null,
    imageUrl: null,
    sortOrder: 4,
  },
  {
    title: "숨긴 카메라",
    description: "공개 페이지에는 보이지 않아요.",
    targetAmount: 15_000,
    fundedAmount: 1_000,
    status: "hidden",
    productUrl: null,
    imageUrl: null,
    sortOrder: 5,
  },
];

const BIRTHDAY_WISH: WishDraft = {
  title: "생일 카드",
  description: "생일 배지를 확인하기 위한 선물이에요.",
  targetAmount: 20_000,
  fundedAmount: 8_000,
  status: "open",
  productUrl: null,
  imageUrl: null,
  sortOrder: 0,
};

const QUIET_WISH: WishDraft = {
  title: "메시지 없는 머그",
  description: "선물은 있고 도착한 메시지는 없어요.",
  targetAmount: 10_000,
  fundedAmount: 0,
  status: "open",
  productUrl: null,
  imageUrl: null,
  sortOrder: 0,
};

const PUBLIC_COPY: Record<
  PublicState,
  { titleSuffix: string; description: string; birthday: string | null }
> = {
  empty: {
    titleSuffix: "빈 위시리스트",
    description: "선물을 하나도 담지 않은 위시리스트예요.",
    birthday: null,
  },
  mixed: {
    titleSuffix: "선물 상태",
    description:
      "진행률 0%·50%·100%, 완료·잠시 멈춤·숨김, 긴 이름, 이미지 없는 선물을 모았어요.",
    birthday: null,
  },
  "birthday-before": {
    titleSuffix: "생일 전",
    description: "생일까지 며칠 남았어요.",
    birthday: BIRTHDAYS.before,
  },
  "birthday-today": {
    titleSuffix: "생일 당일",
    description: "오늘이 생일이에요.",
    birthday: BIRTHDAYS.today,
  },
  "birthday-after": {
    titleSuffix: "생일 이후",
    description: "올해 생일은 이미 지났어요.",
    birthday: BIRTHDAYS.after,
  },
  "messages-none": {
    titleSuffix: "메시지 없음",
    description: "선물은 있지만 도착한 메시지는 없어요.",
    birthday: null,
  },
};

function withIds(drafts: WishDraft[], idBase: number): SeedWish[] {
  return drafts.map((draft, index) => ({
    ...draft,
    id: fixtureUuid(idBase + index),
  }));
}

function wishesForState(state: PublicState, idBase: number): SeedWish[] {
  if (state === "empty") {
    return [];
  }

  if (state === "mixed") {
    return withIds(MIXED_WISHES, idBase);
  }

  if (state === "messages-none") {
    return withIds([QUIET_WISH], idBase);
  }

  return withIds([BIRTHDAY_WISH], idBase);
}

function messageCreatedAt(index: number): string {
  const newest = Date.parse("2026-06-14T03:00:00.000Z");
  return new Date(newest - index * 60 * 60 * 1000).toISOString();
}

function buildAdminMessages(wishes: SeedWish[]): SeedMessage[] {
  const longWishId = wishes.find((wish) => wish.title === LONG_GIFT_TITLE)?.id;
  const midWishId = wishes.find((wish) => wish.title === "진행률 50% 머그")?.id;
  const pausedWishId = wishes.find((wish) => wish.title === "잠시 멈춘 향수")?.id;

  if (!longWishId || !midWishId || !pausedWishId) {
    throw new Error("admin wish ids missing");
  }

  const visible: SeedMessage[] = Array.from(
    { length: VISIBLE_MESSAGE_COUNT },
    (_, index) => {
      const common = {
        id: fixtureUuid(30_000 + index),
        createdAt: messageCreatedAt(index),
        clientRequestId: `shot-admin-msg-${String(index).padStart(2, "0")}`,
        isHidden: false,
      };

      if (index === 0) {
        return {
          ...common,
          wishItemId: longWishId,
          senderName: "오래 준비한 친구",
          body: LONG_MESSAGE,
          amount: 5_000,
        };
      }

      if (index === 1) {
        return {
          ...common,
          wishItemId: midWishId,
          senderName: null,
          body: "이름을 적지 않고 마음만 보냈어요.",
          amount: 3_000,
        };
      }

      if (index === 2) {
        return {
          ...common,
          wishItemId: null,
          senderName: "금액 없는 친구",
          body: "금액 없이 축하 메시지만 남깁니다.",
          amount: null,
        };
      }

      return {
        ...common,
        wishItemId: midWishId,
        senderName: `친구${String(index).padStart(2, "0")}`,
        body: `생일 축하해. 마음 ${String(index).padStart(2, "0")}호를 보태.`,
        amount: 1_000,
      };
    },
  );

  visible.push({
    id: fixtureUuid(30_022),
    wishItemId: pausedWishId,
    senderName: "숨긴 친구",
    body: "이 메시지는 관리 화면의 숨긴 메시지 목록에만 보여요.",
    amount: 7_000,
    isHidden: true,
    createdAt: messageCreatedAt(30),
    clientRequestId: "shot-admin-msg-hidden",
  });

  return visible;
}

function publicIndex(themeIndex: number, stateIndex: number): number {
  return themeIndex * PUBLIC_STATES.length + stateIndex;
}

export function buildUsers(): SeedUser[] {
  const adminWishes = withIds(MIXED_WISHES, 10);
  const users: SeedUser[] = [
    {
      id: ADMIN_USER_ID,
      email: `admin${EMAIL_DOMAIN}`,
      name: "스크린샷 관리자",
      sessionToken: SESSION_BY_NAME.admin,
      role: "관리자 화면. 생일 당일, 상태·진행률이 섞인 선물, 메시지 22개와 숨긴 메시지 1개",
      profile: {
        id: fixtureUuid(2),
        displayName: "스크린샷 관리자",
        birthday: BIRTHDAYS.today,
        description:
          "관리 화면 캡처용 위시리스트예요. 생일 당일과 여러 선물 상태, 긴 메시지를 포함해요.",
      },
      wishlist: {
        id: fixtureUuid(3),
        slug: "shot-admin",
        title: "스크린샷 관리자 위시리스트",
        themeId: "pixel_y2k",
      },
      bankId: fixtureUuid(4),
      wishes: adminWishes,
      messages: buildAdminMessages(adminWishes),
    },
    {
      id: fixtureUuid(5),
      email: `onboarding${EMAIL_DOMAIN}`,
      name: "온보딩 테스터",
      sessionToken: SESSION_BY_NAME.onboarding,
      role: "온보딩 미완료 테스트 유저",
      profile: null,
      wishlist: null,
      bankId: null,
      wishes: [],
      messages: [],
    },
  ];

  THEMES.forEach((theme, themeIndex) => {
    PUBLIC_STATES.forEach((state, stateIndex) => {
      const index = publicIndex(themeIndex, stateIndex);
      const slug = publicSlug(theme, state);
      const copy = PUBLIC_COPY[state];
      const title = `${THEME_LABEL[theme]} ${copy.titleSuffix}`;
      let sessionToken: string | null = null;

      if (theme === "pixel_y2k" && state === "empty") {
        sessionToken = SESSION_BY_NAME.empty;
      }

      if (theme === "pixel_y2k" && state === "messages-none") {
        sessionToken = SESSION_BY_NAME.quiet;
      }

      users.push({
        id: fixtureUuid(100 + index),
        email: `${slug}${EMAIL_DOMAIN}`,
        name: title,
        sessionToken,
        role: `공개 위시리스트 ${theme} / ${state}`,
        profile: {
          id: fixtureUuid(500 + index),
          displayName: title,
          birthday: copy.birthday,
          description: copy.description,
        },
        wishlist: {
          id: fixtureUuid(800 + index),
          slug,
          title,
          themeId: theme,
        },
        bankId: state === "empty" ? null : fixtureUuid(1100 + index),
        wishes: wishesForState(state, 2000 + index * 10),
        messages: [],
      });
    });
  });

  assertFixtureCoverage(users);
  return users;
}

function assertFixtureCoverage(users: SeedUser[]): void {
  if (LONG_GIFT_TITLE.length < 80 || LONG_GIFT_TITLE.length > 120) {
    throw new Error(`long gift title length ${LONG_GIFT_TITLE.length}`);
  }

  if (LONG_MESSAGE.length < 200 || LONG_MESSAGE.length > 500) {
    throw new Error(`long message length ${LONG_MESSAGE.length}`);
  }

  const admin = users.find((user) => user.sessionToken === SESSION_BY_NAME.admin);

  if (!admin) {
    throw new Error("admin fixture missing");
  }

  const statuses = new Set(admin.wishes.map((wish) => wish.status));

  for (const status of WISH_STATUSES) {
    if (!statuses.has(status)) {
      throw new Error(`admin wishes missing status ${status}`);
    }
  }

  const progresses = admin.wishes.map((wish) =>
    Math.floor((wish.fundedAmount / wish.targetAmount) * 100),
  );

  for (const progress of [0, 50, 100]) {
    if (!progresses.includes(progress)) {
      throw new Error(`admin wishes missing progress ${progress}`);
    }
  }

  if (admin.wishes.some((wish) => wish.imageUrl !== null)) {
    throw new Error("screenshot wishes must not set image urls");
  }

  if (!admin.wishes.some((wish) => wish.title === LONG_GIFT_TITLE)) {
    throw new Error("admin wishes missing long title");
  }

  const visible = admin.messages.filter((message) => !message.isHidden);
  const hidden = admin.messages.filter((message) => message.isHidden);

  if (visible.length < 20) {
    throw new Error(`expected at least 20 visible messages, got ${visible.length}`);
  }

  if (hidden.length < 1) {
    throw new Error("expected a hidden message");
  }

  if (!visible.some((message) => message.body.length >= 200)) {
    throw new Error("expected a long visible message");
  }

  if (!visible.some((message) => message.senderName === null)) {
    throw new Error("expected an anonymous message");
  }

  if (!visible.some((message) => message.amount === null)) {
    throw new Error("expected a message without an amount");
  }

  for (const theme of THEMES) {
    for (const state of PUBLIC_STATES) {
      const slug = publicSlug(theme, state);
      const user = users.find((item) => item.wishlist?.slug === slug);

      if (!user?.profile || !user.wishlist) {
        throw new Error(`missing public fixture ${slug}`);
      }

      if (state === "empty" && user.wishes.length !== 0) {
        throw new Error(`${slug} should have no wishes`);
      }

      if (state !== "empty" && user.wishes.length === 0) {
        throw new Error(`${slug} should have wishes`);
      }

      if (user.messages.length !== 0) {
        throw new Error(`${slug} messages belong on the admin user`);
      }
    }
  }
}

export type Shot = {
  file: string;
  screen: string;
  theme: string;
  width: ShotWidth;
  state: string;
  path: string;
  session: SessionName | "none";
  dataTheme: ThemeId | null;
  openGuide: boolean;
  readyText: string;
  alsoText?: string;
  fieldValue?: {
    selector: string;
    value: string;
  };
  summary: string;
};

function addShot(
  shots: Shot[],
  shot: Omit<Shot, "file" | "width">,
): void {
  for (const width of WIDTHS) {
    shots.push({
      ...shot,
      width,
      file: screenshotName(shot.screen, shot.theme, width, shot.state),
    });
  }
}

function publicReadyText(state: PublicState): string {
  switch (state) {
    case "empty":
      return "아직 공개된 선물이 없어요";
    case "mixed":
      return "한정판 크림색";
    case "birthday-before":
      return BIRTHDAY_BADGE.before;
    case "birthday-today":
      return BIRTHDAY_BADGE.today;
    case "birthday-after":
      return BIRTHDAY_BADGE.after;
    case "messages-none":
      return "메시지 없음";
  }
}

function publicSummary(state: PublicState): string {
  switch (state) {
    case "empty":
      return "선물이 없는 공개 위시리스트. 계좌 안내 없음.";
    case "mixed":
      return "open·fulfilled·paused·hidden(숨김은 공개 페이지에서 제외), 진행률 0·50·100, 긴 이름, 이미지 없음, 상품 링크 1개.";
    case "birthday-before":
      return "고정 시각 기준 생일 D-5. 선물 1개.";
    case "birthday-today":
      return "고정 시각 기준 생일 당일(D-DAY). 선물 1개.";
    case "birthday-after":
      return "고정 시각 기준 생일이 지난 뒤(다음 생일 D-360). 선물 1개.";
    case "messages-none":
      return "선물은 있고 메시지는 0개. 공개 페이지는 받은 메시지 목록을 그리지 않는다.";
  }
}

function captureRank(shot: Shot): number {
  if (shot.session === "admin" && shot.path === "/admin/messages") {
    return 2;
  }

  if (shot.session === "admin") {
    return 1;
  }

  return 0;
}

export function buildShots(): Shot[] {
  const shots: Shot[] = [];

  addShot(shots, {
    screen: "landing",
    theme: "default",
    state: "default",
    path: "/",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "내 위시리스트 만들기",
    summary: "비로그인 랜딩.",
  });
  addShot(shots, {
    screen: "landing",
    theme: "default",
    state: "signed-in",
    path: "/",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "내 위시리스트 관리하기",
    summary: "온보딩을 마친 관리자 세션의 랜딩 CTA.",
  });
  addShot(shots, {
    screen: "landing",
    theme: "default",
    state: "onboarding",
    path: "/",
    session: "onboarding",
    dataTheme: null,
    openGuide: false,
    readyText: "위시리스트 만들기 계속하기",
    summary: "온보딩 미완료 세션의 랜딩 CTA.",
  });

  for (const theme of THEMES) {
    addShot(shots, {
      screen: "sample",
      theme,
      state: "default",
      path: `/sample?theme=${theme}`,
      session: "none",
      dataTheme: theme,
      openGuide: false,
      readyText: SAMPLE_BIRTHDAY_BADGE,
      summary:
        "DB 없이 렌더되는 샘플. 생일 배지(5월 15일)는 서버 시각이 고정돼 있어야 D-334다.",
    });
  }

  for (const theme of THEMES) {
    for (const state of PUBLIC_STATES) {
      addShot(shots, {
        screen: "wishlist",
        theme,
        state,
        path: `/wishlist/${publicSlug(theme, state)}`,
        session: "none",
        dataTheme: theme,
        openGuide: false,
        readyText: publicReadyText(state),
        summary: publicSummary(state),
      });
    }
  }

  addShot(shots, {
    screen: "admin",
    theme: "default",
    state: "default",
    path: "/admin",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "생일 축하해요, 스크린샷 관리자님!",
    summary:
      "관리자 대시보드. 고정 시각이 생일이라 축하 배너가 보이고, 안 읽은 메시지는 22개다.",
  });
  addShot(shots, {
    screen: "admin",
    theme: "default",
    state: "empty",
    path: "/admin",
    session: "empty",
    dataTheme: null,
    openGuide: false,
    readyText: "등록된 선물이 없습니다.",
    summary: "선물이 없는 위시리스트의 대시보드.",
  });
  addShot(shots, {
    screen: "admin",
    theme: "default",
    state: "guide",
    path: "/admin?guide=1",
    session: "admin",
    dataTheme: null,
    openGuide: true,
    readyText: "갖고 싶은 선물을 담아요",
    summary: "첫 진입 사용 가이드 다이얼로그.",
  });
  addShot(shots, {
    screen: "admin-wishes",
    theme: "default",
    state: "mixed",
    path: "/admin/wishes",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "숨긴 카메라",
    summary:
      "선물 관리. open·fulfilled·paused·hidden과 진행률 0·50·100, 긴 이름, 이미지 없음.",
  });
  addShot(shots, {
    screen: "admin-wishes",
    theme: "default",
    state: "empty",
    path: "/admin/wishes",
    session: "empty",
    dataTheme: null,
    openGuide: false,
    readyText: "등록된 선물이 없습니다.",
    summary: "선물이 없을 때 추가 폼이 펼쳐진 선물 관리.",
  });
  addShot(shots, {
    screen: "admin-messages",
    theme: "default",
    state: "hidden",
    path: "/admin/messages?filter=hidden",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "숨긴 메시지 목록에만",
    summary: "숨긴 메시지 1개. 받은 메시지 화면보다 먼저 찍어 읽음 처리 전의 뱃지를 유지한다.",
  });
  addShot(shots, {
    screen: "admin-messages",
    theme: "default",
    state: "empty",
    path: "/admin/messages",
    session: "quiet",
    dataTheme: null,
    openGuide: false,
    readyText: "아직 메시지가 없습니다.",
    summary: "선물은 있고 메시지는 0개인 메시지함.",
  });
  addShot(shots, {
    screen: "admin-messages",
    theme: "default",
    state: "many",
    path: "/admin/messages",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "올해는 멀리 있어도",
    summary:
      "받은 메시지 22개. 긴 메시지, 익명, 금액 없음, 선물 없는 메시지를 포함한다. 이 화면은 읽음 처리되므로 관리자 세션 캡처의 마지막이다.",
  });
  addShot(shots, {
    screen: "admin-settings",
    theme: "default",
    state: "default",
    path: "/admin/settings",
    session: "admin",
    dataTheme: null,
    openGuide: false,
    readyText: "계좌 안내",
    fieldValue: { selector: "#birthday", value: BIRTHDAYS.today },
    summary: "설정. 생일 입력값은 고정 시각의 당일 생일.",
  });
  addShot(shots, {
    screen: "login",
    theme: "default",
    state: "default",
    path: "/login",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "Google로 계속하기",
    summary: "소셜 로그인 화면. OAuth는 호출하지 않는다.",
  });
  addShot(shots, {
    screen: "login",
    theme: "default",
    state: "notice",
    path: "/login?notice=under_minimum_age",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "만 14세 미만은 가입할 수 없어",
    summary: "만 14세 미만으로 로그인 정보가 삭제된 뒤의 안내.",
  });
  addShot(shots, {
    screen: "onboarding",
    theme: "default",
    state: "default",
    path: "/onboarding",
    session: "onboarding",
    dataTheme: null,
    openGuide: false,
    readyText: "기본 위시리스트 만들기",
    fieldValue: { selector: "#displayName", value: "온보딩 테스터" },
    summary: "세션은 있고 온보딩은 끝나지 않은 화면. 달력의 오늘은 브라우저 시계를 따른다.",
  });
  addShot(shots, {
    screen: "terms",
    theme: "default",
    state: "default",
    path: "/terms",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "제1조 (목적)",
    alsoText: `${LEGAL_OPERATOR_NAME}(이하`,
    summary: "이용약관. 운영자 이름은 LEGAL_OPERATOR_NAME.",
  });
  addShot(shots, {
    screen: "privacy",
    theme: "default",
    state: "default",
    path: "/privacy",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "제1조 (수집하는 개인정보 항목)",
    alsoText: `${LEGAL_OPERATOR_NAME}(이하`,
    summary: "개인정보 처리방침.",
  });
  addShot(shots, {
    screen: "not-found",
    theme: "default",
    state: "default",
    path: "/screenshot-missing-route",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "페이지를 찾을 수 없어요",
    summary: "루트 not-found.",
  });
  addShot(shots, {
    screen: "wishlist-not-found",
    theme: "default",
    state: "default",
    path: "/wishlist/shot-missing",
    session: "none",
    dataTheme: null,
    openGuide: false,
    readyText: "위시리스트를 찾을 수 없어요",
    summary: "없는 공개 슬러그. 시드하지 않는다.",
  });

  const files = new Set<string>();

  for (const shot of shots) {
    if (files.has(shot.file)) {
      throw new Error(`duplicate screenshot file ${shot.file}`);
    }

    files.add(shot.file);
  }

  shots.sort(
    (left, right) =>
      captureRank(left) - captureRank(right) ||
      left.file.localeCompare(right.file),
  );

  return shots;
}

export function renderScreenshotReadme(users: SeedUser[], shots: Shot[]): string {
  const grouped = new Map<string, Shot[]>();

  for (const shot of shots) {
    const key = `${shot.screen}|${shot.theme}|${shot.state}|${shot.path}`;
    const list = grouped.get(key) ?? [];
    list.push(shot);
    grouped.set(key, list);
  }

  const shotRows = [...grouped.values()]
    .map((group) => {
      const shot = group[0];
      const files = group
        .map((item) => `\`${item.file}\``)
        .sort()
        .join("<br>");

      return `| ${shot.screen} | ${shot.theme} | ${shot.state} | \`${shot.path}\` | ${shot.summary} | ${files} |`;
    })
    .join("\n");

  const userRows = users
    .map((user) => {
      const wishes = String(user.wishes.length);
      const messages = String(user.messages.length);
      const slug = user.wishlist?.slug ?? "—";
      const theme = user.wishlist?.themeId ?? "—";
      const birthday = user.profile?.birthday ?? "—";
      const token = user.sessionToken ?? "—";

      return `| \`${user.email}\` | \`${token}\` | \`${slug}\` | ${theme} | ${birthday} | ${wishes} | ${messages} | ${user.role} |`;
    })
    .join("\n");

  return `# 디자인 스크린샷

토큰을 옮기기 전과 후의 화면을 비교할 때 쓰는 기준 이미지예요. \`pnpm screenshots\`가 Playwright로 다시 찍습니다. 앱 동작 코드는 바꾸지 않아요.

## 파일명

\`{화면}-{테마}-{폭}-{상태}.png\`

- 테마가 없는 화면(랜딩, 관리자, 로그인 등)은 테마 자리에 \`default\`
- 상태가 하나뿐이면 \`default\`
- 폭은 \`375\`(모바일)와 \`1280\`(데스크톱)
- 예: \`wishlist-pixel_y2k-375-empty.png\`

## 고정 시각

기준 시각은 **${SCREENSHOT_FIXED_LABEL}** (\`${SCREENSHOT_FIXED_AT}\`)예요. 촬영일이 달라도 같은 날을 보도록 맞춥니다.

| 구분 | 생일 | 배지 |
| --- | --- | --- |
| 생일 전 | \`${BIRTHDAYS.before}\` | ${BIRTHDAY_BADGE.before} |
| 생일 당일 | \`${BIRTHDAYS.today}\` | ${BIRTHDAY_BADGE.today} |
| 생일 이후 | \`${BIRTHDAYS.after}\` | ${BIRTHDAY_BADGE.after} |

생일 연도는 1996년이라 만 14세 제한에 걸리지 않아요. D-day는 월·일만 보고, 2월 29일이 아닌 날짜라 윤년 보정도 없어요.

시계는 두 곳에서 멈춰요.

- 브라우저: Playwright \`page.clock.setFixedTime\`. \`Date.now()\`와 \`new Date()\`가 ${SCREENSHOT_FIXED_LABEL}에 고정돼요. 온보딩 달력의 "오늘"처럼 클라이언트 \`Date\`만 여기 영향을 받아요.
- 서버: 캡처용 dev 서버만 \`NODE_OPTIONS=--require ./scripts/screenshot-freeze-clock.cjs\`로 \`Date\`를 같은 시각에 고정해요. 공개 위시리스트 생일 배지, 샘플 페이지 배지, 관리자 생일 축하 배너, 푸터 연도, 설정의 만 14세 \`max\`는 서버 \`new Date()\`라 브라우저 시계만으로는 바뀌지 않아요.

한계:

- Postgres \`now()\`는 멈추지 않아요. 시드는 \`created_at\` / \`updated_at\`을 \`${SEEDED_AT}\` 같은 절대 시각으로 넣어요.
- 프리로드 없이 \`pnpm dev\`를 띄우면 서버 배지는 실제 시각을 따라가요. \`pnpm screenshots\`는 항상 프리로드를 넣어요.
- 생일 콘페티는 \`Math.random()\`이라 픽셀이 달라져요. 캡처는 reduced motion과 \`localStorage\`로 콘페티를 끄고, 축하 문구만 남겨요.
- \`fullPage\` 합성 때 sticky 헤더가 반복되지 않도록 캡처 CSS에서 sticky를 static으로 덮어요. Next.js 개발 인디케이터(\`nextjs-portal\`)도 가려요.
- 애니메이션과 캐럿은 꺼 둡니다.
- 한글 본문은 Geist에 글리프가 없어 OS 산세리프로 대체돼요. 저장소에 들어 있는 이미지는 NanumGothic이 있는 Linux에서 찍었어요. 폰트가 다른 환경에서 다시 찍으면 자형이 달라질 수 있어요.

## 다시 찍는 방법

로컬 Postgres만 사용해요. 시드는 \`@screenshots.local\` 계정과 그 계정의 위시리스트, 시드가 소유한 \`shot-*\` 슬러그를 지우고 다시 넣어요. 데이터베이스 호스트가 localhost가 아니면 중단합니다.

\`\`\`bash
# 1. Postgres. 역할과 DB 이름은 .env.example 과 같아요.
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE mwagotgo OWNER postgres;"

# 2. 의존성, Chromium
pnpm install
pnpm exec playwright install chromium

# 3. 마이그레이션. 이미 설정된 환경 변수가 .env.local 보다 우선해요.
DATABASE_URL="${DATABASE_URL_DEFAULT}" \\
DATABASE_DIRECT_URL="${DATABASE_URL_DEFAULT}" \\
pnpm db:migrate

# 4. 시드. pnpm screenshots 의 globalSetup 도 같은 시드를 다시 실행해요.
pnpm db:seed:screenshots

# 5. 캡처. 포트 ${SCREENSHOT_PORT}. 기존 E2E(포트 3200)와 설정 파일이 달라요.
pnpm screenshots
\`\`\`

Node.js 22 이상이 필요해요. 시드 스크립트는 TypeScript를 그대로 실행합니다.

### 환경 변수

\`pnpm screenshots\`가 dev 서버에 넣는 값이에요. 로컬 캡처 전용 더미이고 운영에 쓰지 않아요. \`.env.example\`의 키를 따르며, 비어 있으면 화면이 갈리는 값만 더미로 채워요.

| 변수 | 값 |
| --- | --- |
| \`DATABASE_URL\` / \`DATABASE_DIRECT_URL\` | \`${DATABASE_URL_DEFAULT}\` (환경 변수가 로컬 주소면 그 값을 사용) |
| \`AUTH_SECRET\` | \`${SCREENSHOT_AUTH_SECRET}\` |
| \`AUTH_URL\` | \`${BASE_URL}\` |
| \`ACCOUNT_ENCRYPTION_SECRET\` | \`${SCREENSHOT_ACCOUNT_ENCRYPTION_SECRET}\` |
| \`AUTH_GOOGLE_ID\` / \`AUTH_GOOGLE_SECRET\` | \`screenshot-google-id\` / \`screenshot-google-secret\` |
| \`AUTH_KAKAO_ID\` / \`AUTH_KAKAO_SECRET\` | \`screenshot-kakao-id\` / \`screenshot-kakao-secret\` |
| \`LEGAL_OPERATOR_NAME\` | \`${LEGAL_OPERATOR_NAME}\` |
| \`LEGAL_OPERATOR_CONTACT\` | \`${LEGAL_OPERATOR_CONTACT}\` (비우면 개발 모드에서 \`[문의 이메일 주소]\`가 보여서 더미를 넣음) |
| \`SUPPORT_URL\` | 빈 문자열 (후원하기 링크를 숨김) |
| \`TZ\` | \`UTC\` |

세션은 OAuth를 타지 않아요. 시드가 \`sessions.session_token\`을 넣고, Playwright가 \`http://localhost\`용 쿠키 \`${COOKIE_NAME}\`에 그 토큰을 넣어요. database strategy라 쿠키 값은 토큰 그대로이고, HTTPS가 아니라 \`__Secure-\` 접두사는 붙지 않아요. \`auth.ts\`는 수정하지 않아요.

관리자 첫 진입 가이드는 \`localStorage\` 키 \`${ADMIN_GUIDE_STORAGE_KEY}\`로 닫아 두고, \`guide\` 상태만 \`/admin?guide=1\`로 열어요.

\`pnpm test:e2e\`는 \`playwright.config.ts\`만 보고 \`tests/screenshots\`를 무시해요. 캡처는 \`playwright.screenshots.config.ts\`와 \`pnpm screenshots\`만 사용합니다.

## 시드 계정

계좌를 넣는 사용자는 번호 \`3333-12-1234567\`, 은행 카카오뱅크, 공개 범위 \`always_visible\`이에요. 빈 위시리스트에는 계좌가 없어요. 선물 이미지는 모두 없어요.

메시지 20개 이상은 관리자 계정에만 있어요. 공개 페이지는 받은 메시지 목록을 렌더하지 않아서, 0개와 22개의 차이는 관리자 메시지함 스크린샷으로 봐요. \`messages-none\` 공개 페이지는 선물이 있고 메시지가 0인 데이터예요.

| 이메일 | 세션 토큰 | 슬러그 | 테마 | 생일 | 선물 | 메시지 | 역할 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${userRows}

## 화면 목록

| 화면 | 테마 | 상태 | 라우트 | 설명 | 파일 |
| --- | --- | --- | --- | --- | --- |
${shotRows}

## 찍지 않은 화면

운영 코드를 바꾸지 않고는 아래 에러 바운더리를 안정적으로 열 수 없어요. 라우트로 노출되지 않습니다.

- \`app/error.tsx\`
- \`app/admin/error.tsx\`
- \`app/wishlist/[slug]/error.tsx\`

로딩 화면(\`app/loading.tsx\`, \`app/admin/loading.tsx\`, \`app/wishlist/[slug]/loading.tsx\`)은 요청마다 잠깐 지나가는 상태라 기준 이미지에서 뺐어요.
`;
}

if (LONG_GIFT_TITLE.length < 80 || LONG_GIFT_TITLE.length > 120) {
  throw new Error(`long gift title length ${LONG_GIFT_TITLE.length}`);
}

if (LONG_MESSAGE.length < 200 || LONG_MESSAGE.length > 500) {
  throw new Error(`long message length ${LONG_MESSAGE.length}`);
}
