// 스크린샷 dev 서버 전용. NODE_OPTIONS=--require 로만 올리고, 앱 소스에는 넣지 않는다.
// Playwright page.clock 은 브라우저 시각만 멈추므로, 서버 컴포넌트의 new Date()
// (생일 D-day, 푸터 연도, 관리자 생일 배너)는 이 파일로 같은 시각에 고정한다.
const FIXED_MS = Date.parse("2026-06-15T03:00:00.000Z");
const NativeDate = Date;

function FrozenDate(...args) {
  if (!new.target) {
    return new NativeDate(FIXED_MS).toString();
  }

  const date =
    args.length === 0 ? new NativeDate(FIXED_MS) : new NativeDate(...args);
  Object.setPrototypeOf(date, FrozenDate.prototype);
  return date;
}

FrozenDate.prototype = Object.create(NativeDate.prototype);
FrozenDate.prototype.constructor = FrozenDate;
Object.setPrototypeOf(FrozenDate, NativeDate);

// Date.UTC / Date.parse 는 원래 non-enumerable 상속 속성이라,
// own property만 복사하는 런타임(Next dev worker 등)에서는 함수가 사라진다.
for (const name of ["parse", "UTC"]) {
  Object.defineProperty(FrozenDate, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value: (...args) => NativeDate[name](...args),
  });
}

FrozenDate.now = function now() {
  return FIXED_MS;
};

global.Date = FrozenDate;
