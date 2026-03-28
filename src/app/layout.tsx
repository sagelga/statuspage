import type { Metadata } from "next";
import "./globals.css";
import favicon from "./favicon.png";
import { ThemeProvider } from "@/hooks/useTheme";
import CookieConsentBanner from "@/components/cookies/CookieConsentBanner";

const BASE_URL = 'https://status.byteside.one';

export const metadata: Metadata = {
  title: "สถานะระบบ ByteSide.one — ตรวจสอบการทำงานของบริการแบบเรียลไทม์",
  description: "ตรวจสอบสถานะการทำงานของบริการทั้งหมดในเครือ ByteSide.one แบบเรียลไทม์ รวมถึงเว็บไซต์ เครือข่าย และระบบฐานข้อมูล",
  keywords: ["ByteSide", "status page", "สถานะระบบ", "uptime", "ตรวจสอบบริการ", "tech news Thailand", "ByteSide.one"],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'ByteSide.one',
    title: 'สถานะระบบ ByteSide.one',
    description: 'ตรวจสอบสถานะการทำงานของบริการทั้งหมดในเครือ ByteSide.one แบบเรียลไทม์',
    images: [
      {
        url: '/img/logo-large.png',
        width: 1200,
        height: 630,
        alt: 'ByteSide.one Status Page',
      },
    ],
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@byteside',
    title: 'สถานะระบบ ByteSide.one',
    description: 'ตรวจสอบสถานะการทำงานของบริการทั้งหมดในเครือ ByteSide.one แบบเรียลไทม์',
    images: ['/img/logo-large.png'],
  },
  icons: {
    icon: favicon.src,
  },
};

import { IBM_Plex_Sans_Thai, JetBrains_Mono } from "next/font/google";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-ibm-plex-sans-thai",
});

const jetBrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${ibmPlexSansThai.variable} ${jetBrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme-preference');
                const theme = stored || 'system';
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = theme === 'system' ? systemDark : theme === 'dark';
                const html = document.documentElement;
                if (isDark) {
                  html.setAttribute('data-theme', 'dark');
                } else {
                  html.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {children}
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
