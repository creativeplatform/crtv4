import { config } from "@/config";
import { cookieToInitialState } from "@account-kit/core";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Creative TV",
  description: "The Way Content Should Be.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Persist state across pages
  const initialState = cookieToInitialState(
    config,
    headers().get("cookie") ?? undefined
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased"
        )}
      >
        <Providers initialState={initialState}>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
