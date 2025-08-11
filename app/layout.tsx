import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

export const metadata: Metadata = {
  title: {
    default: "YT Player - Modern MP3 Player for YouTube",
    template: "%s | YT Player"
  },
  description: "Convert YouTube videos to MP3 and enjoy music with a modern, sleek player interface. High-quality audio conversion with instant playback.",
  keywords: [
    "youtube to mp3",
    "youtube converter",
    "mp3 player",
    "music player",
    "youtube music",
    "audio converter",
    "online music player",
    "youtube downloader",
    "music streaming",
    "playlist manager"
  ],
  authors: [{ name: "YT Player Team" }],
  creator: "YT Player",
  publisher: "YT Player",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://saidy-player.netlify.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://saidy-player.netlify.app',
    title: 'YT Player - Modern MP3 Player for YouTube',
    description: 'Convert YouTube videos to MP3 and enjoy music with a modern, sleek player interface.',
    siteName: 'YT Player',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'YT Player - Modern MP3 Player for YouTube',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'YT Player - Modern MP3 Player for YouTube',
    description: 'Convert YouTube videos to MP3 and enjoy music with a modern, sleek player interface.',
    images: ['/og-image.png'],
    creator: '@ytplayer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.youtube.com" />
        <link rel="dns-prefetch" href="//img.youtube.com" />

        {/* Preload critical CSS */}
        <link rel="preload" href="/globals.css" as="style" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "YT Player",
              "description": "Modern MP3 Player for YouTube videos",
              "url": "https://saidy-player.netlify.app",
              "applicationCategory": "MusicApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "YT Player"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '14px',
                fontWeight: '500',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}