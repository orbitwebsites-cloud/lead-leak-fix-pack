import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Leak Fix Pack — Same-Day Website Conversion Teardown",
  description: "A human-reviewed website conversion teardown, replacement hero copy, FAQ content, and prioritized fixes for one fixed $100 price.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
