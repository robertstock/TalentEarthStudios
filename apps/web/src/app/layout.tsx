import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ThreeBackground from "@/components/ThreeBackground";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "WME+ | Execution Layer",
  description: "A representation layer for those who create.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
      </head>
      <body suppressHydrationWarning className={`${inter.variable} font-sans bg-wme-base text-wme-text overflow-x-hidden antialiased selection:bg-slate-700 selection:text-white`}>
        <Providers>
          <ThreeBackground />
          <Navbar />
          <main className="relative z-10 w-full min-h-screen opacity-100 transition-opacity duration-500 pb-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
