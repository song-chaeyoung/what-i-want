"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const CONFETTI_COUNT = 40;
const CONFETTI_LIFETIME_MS = 2500;
const COLORS = ["#0f766e", "#7c3aed", "#f59e0b", "#ec4899", "#10b981"];

type ConfettiPiece = {
  id: number;
  left: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
};

type ConfettiState = {
  storageKey: string;
  pieces: ConfettiPiece[];
} | null;

type ConfettiStyle = CSSProperties & {
  "--drift": `${number}px`;
  "--drift-reverse": `${number}px`;
};

type BirthdayConfettiProps = {
  userId: string;
  dateKey: string;
};

export function BirthdayConfetti({
  userId,
  dateKey,
}: BirthdayConfettiProps) {
  const [celebration, setCelebration] = useState<ConfettiState>(null);
  const startedKeyRef = useRef<string | null>(null);
  const storageKey = `birthday-confetti-${userId}-${dateKey}`;

  useEffect(() => {
    if (startedKeyRef.current !== storageKey) {
      let shouldStart = true;

      try {
        shouldStart = window.localStorage.getItem(storageKey) !== "1";

        if (shouldStart) {
          window.localStorage.setItem(storageKey, "1");
        }
      } catch {
        // Allow the celebration when storage is unavailable.
      }

      startedKeyRef.current = storageKey;
      // This synchronizes client state with external storage after hydration.
      setCelebration(
        shouldStart
          ? { storageKey, pieces: createConfettiPieces() }
          : null,
      );
    }

    const timeoutId = window.setTimeout(() => {
      setCelebration(null);
    }, CONFETTI_LIFETIME_MS);

    return () => window.clearTimeout(timeoutId);
  }, [storageKey]);

  if (celebration === null || celebration.storageKey !== storageKey) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden motion-reduce:hidden"
    >
      {celebration.pieces.map((piece) => {
        const style = {
          left: `${piece.left}%`,
          width: piece.width,
          height: piece.height,
          backgroundColor: piece.color,
          animationDelay: `${piece.delay}ms`,
          animationDuration: `${piece.duration}ms`,
          "--drift": `${piece.drift}px`,
          "--drift-reverse": `${-piece.drift}px`,
        } satisfies ConfettiStyle;

        return (
          <span
            key={piece.id}
            className="admin-birthday-confetti-piece absolute top-0 block rounded-sm"
            style={style}
          />
        );
      })}
    </div>
  );
}

function createConfettiPieces(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, id) => {
    const direction = Math.random() < 0.5 ? -1 : 1;

    return {
      id,
      left: Math.round(Math.random() * 100),
      width: 5 + Math.round(Math.random() * 4),
      height: 8 + Math.round(Math.random() * 5),
      color: COLORS[id % COLORS.length],
      delay: Math.round(Math.random() * 200),
      duration: 1900 + Math.round(Math.random() * 300),
      drift: direction * (30 + Math.round(Math.random() * 50)),
    };
  });
}
