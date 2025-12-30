"use client"

import { MoonIcon, SunIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline"
import { useTheme } from "next-themes"
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-11 h-11 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    )
  }

  const themes = [
    { value: 'light', label: 'Hell', icon: SunIcon },
    { value: 'dark', label: 'Dunkel', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ]

  const currentTheme = themes.find(t => t.value === theme) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="flex items-center justify-center w-11 h-11 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Theme wechseln"
        title="Theme wechseln"
      >
        <CurrentIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="absolute right-0 mt-2 w-40 origin-top-right rounded-xl bg-popover shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-border overflow-hidden z-50">
        <div className="py-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <MenuItem key={value}>
              <button
                onClick={() => setTheme(value)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${
                  theme === value
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
                {theme === value && (
                  <span className="ml-auto text-primary" aria-hidden="true">✓</span>
                )}
              </button>
            </MenuItem>
          ))}
        </div>
      </MenuItems>
    </Menu>
  )
}
