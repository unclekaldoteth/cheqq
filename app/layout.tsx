import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cheqq - Payroll & DeFi. Unified on Base.",
  description: "The all-in-one platform for invoice management, borderless payroll, and DeFi yield generation. Built on Base for the future of business finance.",
  keywords: ["payroll", "invoice", "DeFi", "Base", "stablecoin", "IDRX", "crypto payments"],
  openGraph: {
    title: "Cheqq - Payroll & DeFi. Unified on Base.",
    description: "The all-in-one platform for invoice management, borderless payroll, and DeFi yield generation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
