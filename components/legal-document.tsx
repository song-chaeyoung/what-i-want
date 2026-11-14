import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { BRAND_NAME } from "@/src/lib/design/copy";
import type { LegalDocument } from "@/src/lib/legal/documents";

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <main className="pixel-dot-bg min-h-dvh text-ink">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
        <Link
          href="/"
          className="font-pixel text-sm tracking-normal text-accent-main hover:underline"
        >
          {BRAND_NAME}
        </Link>

        <Card
          asChild
          variant="pixel"
          surface="paper"
          shadow="lg"
          className="mt-4 p-5 sm:p-6"
        >
          <header>
            <h1 className="font-pixel text-3xl tracking-normal text-purple sm:text-4xl">
              {document.title}
            </h1>
            <p className="mt-3 text-xs font-black text-ink-faint">
              시행일: {document.effectiveDate}
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-ink-soft">
              {document.intro}
            </p>
          </header>
        </Card>

        <div className="mt-5 space-y-4">
          {document.sections.map((section) => (
            <Card
              key={section.heading}
              asChild
              variant="pixel"
              surface="white"
              shadow="md"
              className="p-5 sm:p-6"
            >
              <section>
              <h2 className="text-base font-black text-ink sm:text-lg">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph, index) => (
                <p
                  key={index}
                  className="mt-3 text-sm font-semibold leading-7 text-ink-soft"
                >
                  {paragraph}
                </p>
              ))}
              {section.items ? (
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-sm font-semibold leading-7 text-ink-soft"
                    >
                      <span aria-hidden="true" className="text-accent-main">
                        •
                      </span>
                      <span className="break-keep">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              </section>
            </Card>
          ))}
        </div>
      </div>

      <SiteFooter variant="minimal" />
    </main>
  );
}
