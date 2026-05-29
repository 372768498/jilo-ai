import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Jilo.ai - AI Tool Intelligence, Access Guides, Workflows and Reviews",
  description:
    "Jilo.ai helps users discover, evaluate, access, and apply AI tools through practical reviews, workflows, deals, and high-intent AI tool intelligence.",
  verification: {
    other: {
      "impact-site": "8b17145f-f60a-47b8-8ce5-c00d8dcf8092",
    },
  },
  metadataBase: new URL("https://www.jilo.ai"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MZN9CXF4');`,
          }}
        />
        <Script id="ga4-script" strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-GZ8RJ2E0S4" />
        <Script
          id="ga4-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-GZ8RJ2E0S4');`,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MZN9CXF4"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
