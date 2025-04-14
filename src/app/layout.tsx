import "~/styles/globals.css";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "PRzilla",
  description: "Track your WOD progress and PRs",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
      </body>
    </html>
  );
}
