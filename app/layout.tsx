import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import CookieNotice from "@/components/public/layout/CookieNotice";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Alter Ego Experience",
  description: "Realtime ranking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
