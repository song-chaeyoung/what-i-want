import Link from "next/link";
import { BRAND_NAME, FOOTER_COPY } from "@/src/lib/design/copy";

type SiteFooterProps = {
  variant?: "full" | "minimal";
};

export function SiteFooter({ variant = "full" }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const supportUrl = process.env.SUPPORT_URL?.trim();

  return (
    <footer className="border-t-2 border-[#171717] bg-white text-[#171717]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-pixel text-lg leading-none tracking-normal text-[#4c1d95]">
          {BRAND_NAME}
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            href="/terms"
            className="text-sm font-black underline-offset-4 hover:underline"
          >
            {FOOTER_COPY.termsLabel}
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-black underline-offset-4 hover:underline"
          >
            {FOOTER_COPY.privacyLabel}
          </Link>
          <FooterLink href={FOOTER_COPY.contactUrl} label={FOOTER_COPY.contactLabel} />
          {variant === "full" && supportUrl ? (
            <FooterLink href={supportUrl} label={FOOTER_COPY.supportLabel} />
          ) : null}
        </nav>
        <p className="text-xs font-bold text-[#6b7280]">
          © {year} {BRAND_NAME}
        </p>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-black underline-offset-4 hover:underline"
    >
      {label}
    </a>
  );
}
