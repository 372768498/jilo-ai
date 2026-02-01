import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit Your AI Tool - Jilo.ai",
  description:
    "Submit your AI tool to Jilo.ai directory. Get featured among 70+ curated AI tools and reach thousands of users looking for AI solutions.",
  openGraph: {
    title: "Submit Your AI Tool | Jilo.ai",
    description: "Get your AI tool featured in our curated directory.",
    url: "https://jilo.ai/submit",
  },
  alternates: {
    canonical: "https://jilo.ai/submit",
  },
};

export default function SubmitLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
