export const dynamic = "force-dynamic";

import "./globals.css";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Vi-Farm Admin Dashboard",
  description: "Admin panel for managing vendors, buyers, products, and orders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body className="flex flex-col md:flex-row bg-gray-100 min-h-screen">

        {/* Sidebar (real sidebar here, paste actual code) */}

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
