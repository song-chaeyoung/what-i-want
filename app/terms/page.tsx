import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { BRAND_NAME } from "@/src/lib/design/copy";
import { TERMS_OF_SERVICE } from "@/src/lib/legal/documents";

export const metadata: Metadata = {
  title: `${TERMS_OF_SERVICE.title} | ${BRAND_NAME}`,
  description: `${BRAND_NAME}의 이용약관입니다.`,
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return <LegalDocumentView document={TERMS_OF_SERVICE} />;
}
