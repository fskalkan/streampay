import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamPay — streaming payments on Stellar",
  description:
    "Create, withdraw, top up and cancel continuous per-second payment streams on the Stellar network.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
