import "~/styles/globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.przilla.app"), // Set base URL for resolving paths
  title: {
    default: "PRzilla", // Default title
    template: "%s | PRzilla", // Template for page-specific titles
  },
  description:
    "Track your WOD progress, import from SugarWOD, and visualize your fitness journey with PRzilla.", // Default description
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "PRzilla",
    description:
      "Track your WOD progress, import from SugarWOD, and visualize your fitness journey with PRzilla.",
    url: "https://www.przilla.app",
    siteName: "PRzilla",
    type: "website",
    images: [
      {
        url: "https://www.przilla.app/images/og.png",
        width: 800,
        height: 600,
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary", // Use "summary_large_image" if you add an image
    title: "PRzilla",
    description:
      "Track your WOD progress, import from SugarWOD, and visualize your fitness journey with PRzilla.",
    // site: '@YourTwitterHandle', // Optional: Add Twitter handle
    // creator: '@YourTwitterHandle', // Optional: Add Twitter handle
    // images: ['https://www.przilla.app/twitter-image.png'], // Optional: Add image URL later
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning is recommended by next-themes when using class attribute
    <html
      lang="en"
      className={`${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Removed SessionProvider wrapper */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Theme accentColor="blue" grayColor="slate">
            <TRPCReactProvider>{children}</TRPCReactProvider>
          </Theme>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
