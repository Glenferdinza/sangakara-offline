import type { Metadata } from "next";
import "../styles/index.css";
import { LayoutShell } from "./components/LayoutShell";

export const metadata: Metadata = {
  title: "SANGKARA - Dashboard",
  description:
    "Manage and analyze character development programs for youth with real-time data insights and intuitive controls, designed for educational institutions.",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ height: "100%", margin: 0 }}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
