import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: "Compounder's Luck",
  description: "A Trading Strategy Toolkit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-body antialiased bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto px-4 py-8 md:py-12">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
