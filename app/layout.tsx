import type { Metadata } from "next";
import "@/app/globals.css";
import { DemoProvider } from "@/components/demo-provider";

export const metadata: Metadata = {
  title: "BridgeHire · Privacy-first recruitment",
  description: "A controlled recruitment workflow connecting employers and candidates through a trusted admin team.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
