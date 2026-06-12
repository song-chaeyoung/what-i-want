import Image from "next/image";
import Link from "next/link";
import { BRAND_NAME } from "@/src/lib/design/copy";

type TextLogoProps = {
  href?: string;
  className?: string;
};

export function TextLogo({ href, className = "" }: TextLogoProps) {
  const logo = (
    <>
      <Image
        src="/logo.png"
        alt=""
        width={56}
        height={56}
        style={{ imageRendering: "pixelated" }}
        preload
        unoptimized
      />
      <span className="font-pixel text-2xl leading-none tracking-normal text-[#4c1d95] sm:text-3xl">
        {BRAND_NAME}
      </span>
    </>
  );

  const logoClassName = `inline-flex items-center gap-2 ${className}`;

  if (href) {
    return (
      <Link href={href} className={logoClassName}>
        {logo}
      </Link>
    );
  }

  return <div className={logoClassName}>{logo}</div>;
}
