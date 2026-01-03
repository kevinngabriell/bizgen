import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "BizGen",
  description: "BizGen solutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body>
        <Provider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </Provider>
      </body>
    </html>
  );
}
