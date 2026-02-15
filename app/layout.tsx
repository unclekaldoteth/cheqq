import type { Metadata } from "next";
import "./globals.css";
import { OnchainProvider } from "@/providers/OnchainProvider";
import { UserProvider } from "@/contexts/UserContext";

export const metadata: Metadata = {
  title: "Cheqq - Payroll & Stablecoin Payments on Tempo",
  description: "The all-in-one platform for invoice management, borderless payroll, and stablecoin payments. Built on Tempo for the future of business finance.",
  keywords: ["payroll", "invoice", "stablecoin", "Tempo", "payments", "crypto payments", "AlphaUSD"],
  openGraph: {
    title: "Cheqq - Payroll & Stablecoin Payments on Tempo",
    description: "The all-in-one platform for invoice management, borderless payroll, and stablecoin payments.",
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
        <OnchainProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </OnchainProvider>
      </body>
    </html>
  );
}
