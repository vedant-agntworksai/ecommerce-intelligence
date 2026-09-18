import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Ecommerce Intelligence",
  description: "Unified retailer intelligence across Amazon, Walmart, Lowe's, and Home Depot",
};

export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body><AppShell>{children}</AppShell></body></html>;
}
