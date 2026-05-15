import type { Metadata } from "next";
import { BestToolsFallbackPage, getFallbackMetadata } from "@/components/seo-fallback-page";

type PageProps = {
  params: { locale: string; slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  return getFallbackMetadata(params.slug, "best", params.locale);
}

export default async function BestPage({ params }: PageProps) {
  return <BestToolsFallbackPage locale={params.locale} slug={params.slug} mode="best" />;
}
