// app/[locale]/tools/[slug]/page.tsx
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import SeoJsonLd from "@/components/SeoJsonLd";
import Link from "next/link";

type PageProps = { params: { locale: string; slug: string } };

export default async function ToolDetailPage({ params }: PageProps) {
  const locale = params?.locale || "en";
  const slug = params?.slug;

  const { data, error } = await supabase
    .from("tools")
    .select(`
      id, slug, name, short_desc, long_desc, logo_url, official_url,
      pricing, platforms, languages, open_source, need_login, last_update_at
    `)
    .eq("slug", slug)
    .single();

  if (error || !data) return notFound();

  // JSON-LD for SoftwareApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": data.name,
    "applicationCategory": "AI Tool",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": data.pricing === "free" ? "0" : undefined,
      "priceCurrency": "USD"
    },
    "url": `https://www.jilo.ai/${locale}/tools/${data.slug}`,
    "description": data.short_desc || data.long_desc || "",
    "image": data.logo_url || undefined
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <SeoJsonLd data={jsonLd} />

      <div className="text-sm mb-3 text-muted-foreground">
        <Link href={`/${locale}/tools`}>← Back to Tools</Link>
      </div>

      <div className="flex items-start gap-4">
        {data.logo_url && (
          <img
            src={data.logo_url}
            alt={data.name}
            className="w-14 h-14 rounded-xl object-cover"
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{data.name}</h1>
          {data.short_desc && (
            <p className="text-muted-foreground mt-1">{data.short_desc}</p>
          )}
          {data.official_url && (
            <a
              href={data.official_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-sm mt-2 inline-block"
            >
              Visit website
            </a>
          )}
        </div>
      </div>

      {/* ======= TODO: 这里放你原本的详情主体渲染 ======= */}
      {data.long_desc && <p className="mt-6 leading-7">{data.long_desc}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8 text-sm">
        <div><span className="text-muted-foreground">Pricing:</span> {data.pricing || "-"}</div>
        <div><span className="text-muted-foreground">Open-source:</span> {data.open_source ? "Yes" : "No"}</div>
        <div><span className="text-muted-foreground">Login required:</span> {data.need_login ? "Yes" : "No"}</div>
        <div><span className="text-muted-foreground">Platforms:</span> {Array.isArray(data.platforms) ? data.platforms.join(", ") : "-"}</div>
        <div><span className="text-muted-foreground">Languages:</span> {Array.isArray(data.languages) ? data.languages.join(", ") : "-"}</div>
        <div><span className="text-muted-foreground">Last update:</span> {data.last_update_at ? new Date(data.last_update_at).toISOString().slice(0,10) : "-"}</div>
      </div>
    </div>
  );
}
