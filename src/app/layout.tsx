import type { Metadata } from "next";
import { headers } from "next/headers";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { PageTransitionProvider } from "@/components/contexts/PageTransitionContext";
import "../styles/globals.css";
import "../styles/themes.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://littlelogbook.com'),
  title: {
    default: "Little Logbook",
    template: "%s | Little Logbook"
  },
  description: "Create beautiful family logbooks to document your adventures together",
  keywords: ["family", "logbook", "memories", "photos", "journal", "adventures", "documentation"],
  authors: [{ name: "Little Logbook Team" }],
  creator: "Little Logbook",
  publisher: "Little Logbook",
  applicationName: "Little Logbook",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Little Logbook",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Little Logbook",
    title: "Little Logbook - Family Memory Keeping",
    description: "Create beautiful family logbooks to document your adventures together",
    url: "https://littlelogbook.com",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Little Logbook",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Little Logbook - Family Memory Keeping",
    description: "Create beautiful family logbooks to document your adventures together",
    images: ["/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    colorScheme: "light dark",
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#2D5A3D" },
      { media: "(prefers-color-scheme: dark)", color: "#4A8061" }
    ],
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const theme = headersList.get('x-theme') || 'forest-light';

  return (
    <html lang="en" data-theme={theme}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Get theme from cookie
                  var cookies = document.cookie.split(';');
                  var theme = 'forest-light';
                  for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i].trim();
                    if (cookie.startsWith('theme=')) {
                      theme = cookie.substring(6);
                      break;
                    }
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'forest-light');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <QueryProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
