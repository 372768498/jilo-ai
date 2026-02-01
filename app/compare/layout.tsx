import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare AI Tools Side by Side - Jilo.ai",
  description:
    "Compare AI tools side by side. See pricing, features, platforms, and more in a clear comparison table. Find the best AI tool for your needs.",
  openGraph: {
    title: "Compare AI Tools | Jilo.ai",
    description: "Side-by-side AI tool comparison with pricing, features, and more.",
    url: "https://jilo.ai/compare",
  },
  alternates: {
    canonical: "https://jilo.ai/compare",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
