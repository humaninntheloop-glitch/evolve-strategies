import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: {
    default: "Human In The Loop — AI Authorization & Governance Platform",
    template: "%s | Human In The Loop",
  },
  description:
    "The system for authorization before AI reliance. Document, review, and authorize every AI interaction in your organization with auditable AI Permission Slips.",
  metadataBase: new URL("https://humanintheloop.ai"),
  keywords: [
    "AI governance",
    "AI authorization",
    "AI permission slip",
    "human in the loop",
    "AI compliance",
    "AI oversight",
    "responsible AI",
    "AI audit",
    "AI risk management",
    "regulated AI workflows",
  ],
  authors: [{ name: "Human In The Loop" }],
  creator: "Human In The Loop",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Human In The Loop",
    title: "Human In The Loop — AI Authorization & Governance Platform",
    description:
      "The system for authorization before AI reliance. Document, review, and authorize every AI interaction with auditable AI Permission Slips.",
    images: [
      {
        url: "/logo-square.png",
        width: 800,
        height: 800,
        alt: "Human In The Loop — AI Governance",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Human In The Loop — AI Authorization & Governance Platform",
    description:
      "The system for authorization before AI reliance. Document, review, and authorize every AI interaction with auditable AI Permission Slips.",
    images: ["/logo-square.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
