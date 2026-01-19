export const dynamic = "force-dynamic";

import "../globals.css"
import type { Metadata } from "next"
import { Sidebar } from "../login/sidebar"

export const metadata: Metadata = {
  title: "Via-Farm Admin Dashboard",
  description: "Admin panel for managing vendors, buyers, products, and orders",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col md:flex-row bg-gray-100 min-h-screen">
        {/* Fixed Sidebar */}
        <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-56 p-8">
          {children}
        </main>
      </body>
    </html>
  )
}
