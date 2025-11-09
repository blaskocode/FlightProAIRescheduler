import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineBanner } from "@/components/mobile/OfflineBanner";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { TopNavigation } from "@/components/navigation/TopNavigation";
import { PWAPrompt } from "@/components/mobile/PWAPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flight Schedule Pro AI Rescheduler",
  description: "AI-Powered Weather Cancellation & Rescheduling System for Flight Schools",
  manifest: '/manifest.json',
  themeColor: '#2563eb',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlightPro',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="service-worker" href="/sw.js" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FlightPro" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js')
                    .then((reg) => {
                      console.log('[SW] Registered:', reg);
                      // Check for updates every time the page loads
                      reg.update();
                      // Listen for updates
                      reg.addEventListener('updatefound', () => {
                        const newWorker = reg.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated') {
                              console.log('[SW] New service worker activated - reloading page');
                              // Reload to use new service worker
                              window.location.reload();
                            }
                          });
                        }
                      });
                    })
                    .catch((err) => {
                      // Silently fail in development - service worker is optional
                      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                        console.error('[SW] Registration failed:', err);
                      }
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <OfflineBanner />
          <TopNavigation />
          {children}
          <BottomNavigation />
          <PWAPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}

