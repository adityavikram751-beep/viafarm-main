/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  ShoppingBasket,
  Users,
  ShoppingCart,
  Settings,
  LayoutDashboard,
  Image as ImageIcon,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const routes = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: ShoppingBasket },
  { href: "/vendors", label: "Vendors", icon: Users },
  { href: "/buyers", label: "Buyers", icon: Users },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/manageapp", label: "Manage App", icon: ImageIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white rounded-r-4xl border-r-4 flex flex-col justify-between border-amber-600">
      {/* Logo */}
      <div>
        <div className="p-4 flex flex-col items-center justify-center">
          <Image
            src="/images/logo.png"
            alt="Via Farming Logo"
            width={90}
            height={90}
            className="object-contain rounded-full shadow-sm"
            priority
          />
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-8">
          {routes.map((route) => {
            const Icon = route.icon
            const isActive = pathname === route.href

            return (
              <Link key={route.href} href={route.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-48 justify-start text-base text-gray-900 p-2 m-4 rounded-lg transition-all duration-200 font-semibold",
                    isActive
                      ? "bg-green-500 text-white hover:bg-green-500"
                      : "hover:bg-green-500 hover:text-white"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {route.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="mb-16 ml-12">
        <button
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-red-600 transition-all font-semibold"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
