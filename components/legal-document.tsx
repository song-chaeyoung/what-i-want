import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { BRAND_NAME } from "@/src/lib/design/copy";
import type { LegalDocument } from "@/src/lib/legal/documents";

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <main className="pixel-dot-bg min-h-dvh text-[#171717]">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
        <Link
          href="/"
          className="font-pixel text-sm tracking-normal text-[#0f766e] hover:underline"
        >
          {BRAND_NAME}
        </Link>

        <header className="mt-4 border-2 border-[#171717] bg-[#fffdf7] p-5 shadow-[6px_6px_0_#111827] sm:p-6">
          <h1 className="font-pixel text-3xl tracking-normal text-[#4c1d95] sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-3 text-xs font-black text-[#6b7280]">
            시행일: {document.effectiveDate}
          </p>
          <p className="mt-3 text-sm font-semibold leading-7 text-[#4b5563]">
            {document.intro}
          </p>
        </header>

        <div className="mt-5 space-y-4">
          {document.sections.map((section) => (
            <section
              key={section.heading}
              className="border-2 border-[#171717] bg-white p-5 shadow-[4px_4px_0_#111827] sm:p-6"
            >
              <h2 className="text-base font-black text-[#171717] sm:text-lg">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 text-sm font-semibold leading-7 text-[#4b5563]"
                >
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm font-semibold leading-7 text-[#4b5563]"
                    >
                      <span aria-hidden="true" className="text-[#0f766e]">
                        •
                      </span>
                      <span className="break-keep">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </div>

      <SiteFooter variant="minimal" />
    </main>
  );
}
