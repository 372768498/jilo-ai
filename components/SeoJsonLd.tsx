// components/SeoJsonLd.tsx
type SeoJsonLdProps = {
  data: Record<string, any>;
};

export default function SeoJsonLd({ data }: SeoJsonLdProps) {
  const json = JSON.stringify(data, null, 0);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
      suppressHydrationWarning
    />
  );
}
