import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from './providers';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mint Jarl Pass",
  description: "Mint your Jarl Pass from the age of vikings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} viking-bg`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
