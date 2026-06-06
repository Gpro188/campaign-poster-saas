import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://campaign-poster.vercel.app"),
  title: "Dpro Campaigns | Grassroots Marketing & Activation",
  description: "Engage, Mobilize, and Win: All-in-One Tools for Grassroots Campaigns",
  openGraph: {
    title: "Dpro Campaigns",
    description: "Engage, Mobilize, and Win: All-in-One Tools for Grassroots Campaigns. Create instantly shareable campaign materials.",
    url: "https://dpro-campaign.vercel.app",
    siteName: "Dpro Campaigns",
    images: [
      {
        url: "https://dpro-campaign.vercel.app/hero_megaphone_illustration.png",
        width: 1200,
        height: 630,
        alt: "Dpro Campaigns Hero",
      }
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dpro Campaigns",
    description: "Engage, Mobilize, and Win: All-in-One Tools for Grassroots Campaigns.",
    images: ["https://dpro-campaign.vercel.app/hero_megaphone_illustration.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
