"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"


export default function AuthGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const sessionAuth = sessionStorage.getItem("warehouse_auth")
      const localAuth = localStorage.getItem("warehouse_auth")
      const authMethod = sessionStorage.getItem("auth_method") || localStorage.getItem("auth_method")

      if (sessionAuth === "true" || localAuth === "true") {
        setIsAuthenticated(true)
        // You could use authMethod to customize the experience based on login method
        console.log("User authenticated via:", authMethod || "email")
      } else {
        setIsAuthenticated(false)
        // Redirect to login if not on login page
        if (pathname !== "/login") {
          router.push("/login")
        }
      }
    }

    checkAuth()
  }, [router, pathname])

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0F0F12]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  // If not authenticated and not on login page, don't render children
  if (!isAuthenticated && pathname !== "/login") {
    return null
  }

  // If authenticated and on login page, redirect to dashboard
  if (isAuthenticated && pathname === "/login") {
    router.push("/dashboard")
    return null
  }

  return <>{children}</>
}
