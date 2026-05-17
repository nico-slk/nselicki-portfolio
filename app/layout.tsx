import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundBlobs from "@/components/backgroundblobs/BackgroundBlobs";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nicolas Selicki Porfolio",
  description: "Personal profesional app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-screen flex flex-col overflow-x-hidden ">
        <BackgroundBlobs />

        <div className="flex-1 z-10 ">
          <LanguageProvider>{children}</LanguageProvider>
        </div>

      </body>
    </html>
  );
}
