import Head from "next/head";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const GLOBAL_TITLE = "canopy - privacy preserving ai camera trap image sorter";
const GLOBAL_DESCRIPTION = "Sort camera trap data with machine learning";
const GLOBAL_URL = "https://canopy.ai/";

export const metadata = {
  title: GLOBAL_TITLE,
  description: GLOBAL_DESCRIPTION,
  manifest: "/manifest.json",
  keywords: [
    GLOBAL_TITLE,
    "AI camera trap",
    "AI conservation",
    "AI camera trap data",
    "AI conservation",
  ],
  metadataBase: new URL(GLOBAL_URL),
  openGraph: {
    title: GLOBAL_TITLE,
    description: GLOBAL_DESCRIPTION,
    url: GLOBAL_URL,
    images: [
      {
        url: `${GLOBAL_URL}og.jpg`,
        width: 1024,
        height: 622,
      },
    ],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@edbayes",
    images: `${GLOBAL_URL}og.jpg`,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Head>
        
        <meta name="application-name" content={GLOBAL_TITLE} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={GLOBAL_TITLE} />

        <meta name="description" content={GLOBAL_DESCRIPTION} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/favicon-16x16.png" />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary_large_image" />
        
        <meta name="twitter:url" content={GLOBAL_URL} />
        <meta name="twitter:title" content={GLOBAL_TITLE} />
        <meta name="twitter:description" content={GLOBAL_DESCRIPTION} />
        
        <meta
        name="twitter:image"
        content="https://www.organizewith.ai/og.jpg"
      />
      <meta name="twitter:creator" content="@edbayes" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={GLOBAL_TITLE} />
      <meta
        property="og:description"
        content={GLOBAL_DESCRIPTION}
      />
      <meta property="og:site_name" content={GLOBAL_TITLE}/>
      <meta property="og:url" content={GLOBAL_URL}/>
      <meta
        property="og:image"
        content="https://www.organizewith.ai/og.jpg"
      />
      </Head>
      <body>{children}</body>
      <Analytics />
    </html>
  );
}
