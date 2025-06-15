"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure the component only uses the actual theme after hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"
  const icon = !mounted ? (
    <Sun className="w-4 h-4" />
  ) : isDark ? (
    <Sun className="w-4 h-4" />
  ) : (
    <Moon className="w-4 h-4" />
  )

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {icon}
    </Button>
  )
}