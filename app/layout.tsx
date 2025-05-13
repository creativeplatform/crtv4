import { config } from "@/config";
import { cookieToInitialState } from "@account-kit/core";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils/utils";
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://tv.creativeplatform.xyz"),
  title: "Creative TV",
  description: "The Way Content Should Be.",
  openGraph: {
    title: "Creative TV",
    description: "The Way Content Should Be.",
    images: [
      {
        url: "https://tv.creativeplatform.xyz/logo-tv.gif",
        width: 500,
        height: 500,
        alt: "Creative TV Animated Logo",
        type: "image/gif",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creative TV",
    description: "The Way Content Should Be.",
    images: ["https://tv.creativeplatform.xyz/logo-tv.gif"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Persist state across pages
  const headersList = headers();
  const initialState = cookieToInitialState(
    config,
    headersList.get("cookie") ?? undefined
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link
          rel="apple-touch-icon"
          href="/icons/CreativeTV_blur-192x192.png"
        />
        {/* Default favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Optional: SVG or PNG favicons */}
        {/* <link rel="icon" type="image/svg+xml" href="/favicon.svg" /> */}
        {/* <link rel="icon" type="image/png" href="/favicon.png" /> */}
      </head>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased"
        )}
      >
        <div id="alchemy-signer-iframe-container" style={{ display: "none" }} />{" "}
        {/* Alchemy signer iframe container for modular account functionality */}
        <Providers initialState={initialState}>
          <Navbar />
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
