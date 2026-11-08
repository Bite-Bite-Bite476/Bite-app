import type { Metadata } from "next";
import { League_Spartan, DM_Sans } from "next/font/google";
import "./globals.css";

const display = League_Spartan({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "BITE. — Tienda de snacks",
  description: "Snacks para pedir y recoger en tu franja de entrega."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${body.variable}`}>
      <body className="font-body">{children}</body>
    </html>
  );
}
