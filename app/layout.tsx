import type { Metadata } from "next";
import "./globals.css";
import "@coinbase/onchainkit/styles.css";
import { OnchainProvider } from "@/providers/OnchainProvider";

export const metadata: Metadata = {
  title: "Cheqq - Payroll & DeFi. Unified on Base.",
  description: "The all-in-one platform for invoice management, borderless payroll, and DeFi yield generation. Built on Base for the future of business finance.",
  keywords: ["payroll", "invoice", "DeFi", "Base", "stablecoin", "IDRX", "crypto payments"],
  openGraph: {
    title: "Cheqq - Payroll & DeFi. Unified on Base.",
    description: "The all-in-one platform for invoice management, borderless payroll, and DeFi yield generation.",
    type: "website",
  },
  other: {
    'base:app_id': '697b8de6748a9bde7c61ac0d',
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://cheqq.endhonesa.com/og.png',
      button: {
        title: 'Launch Cheqq',
        action: {
          type: 'launch_miniapp',
          name: 'Cheqq',
          url: 'https://cheqq.endhonesa.com',
          splashImageUrl: 'https://cheqq.endhonesa.com/splash.png',
          splashBackgroundColor: '#0052FF',
        },
      },
    }),
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
        <OnchainProvider>
          {children}
        </OnchainProvider>
      </body>
    </html>
  );
}

