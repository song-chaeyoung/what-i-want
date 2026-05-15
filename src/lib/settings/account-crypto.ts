import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const ACCOUNT_CRYPTO_VERSION = "v1";
const IV_BYTES = 12;

export type EncryptAccountNumberResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: "missing_secret";
    };

export function encryptAccountNumber(
  accountNumber: string,
  secret: string | undefined,
): EncryptAccountNumberResult {
  const key = deriveKey(secret);

  if (!key) {
    return { ok: false, error: "missing_secret" };
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(accountNumber, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    ok: true,
    value: [
      ACCOUNT_CRYPTO_VERSION,
      iv.toString("base64url"),
      tag.toString("base64url"),
      encrypted.toString("base64url"),
    ].join(":"),
  };
}

export function decryptAccountNumber(
  encryptedAccountNumber: string,
  secret: string | undefined,
): string | null {
  const key = deriveKey(secret);

  if (!key) {
    return null;
  }

  const [version, ivPart, tagPart, encryptedPart] =
    encryptedAccountNumber.split(":");

  if (
    version !== ACCOUNT_CRYPTO_VERSION ||
    !ivPart ||
    !tagPart ||
    !encryptedPart
  ) {
    return null;
  }

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivPart, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function getAccountEncryptionSecret(): string | undefined {
  return process.env.ACCOUNT_ENCRYPTION_SECRET ?? process.env.AUTH_SECRET;
}

function deriveKey(secret: string | undefined): Buffer | null {
  const normalized = secret?.trim();

  if (!normalized) {
    return null;
  }

  return createHash("sha256").update(normalized).digest();
}
