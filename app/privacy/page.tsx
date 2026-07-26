import type { Metadata } from "next";
import { LegalDocumentView } from "@/components/legal-document";
import { BRAND_NAME } from "@/src/lib/design/copy";
import { PRIVACY_POLICY } from "@/src/lib/legal/documents";

export const metadata: Metadata = {
  title: `${PRIVACY_POLICY.title} | ${BRAND_NAME}`,
  description: `${BRAND_NAME}의 개인정보 처리방침입니다.`,
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return <LegalDocumentView document={PRIVACY_POLICY} />;
}
