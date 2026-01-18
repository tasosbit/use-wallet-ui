import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/**
 * Hook to resolve the actual theme value, handling 'system' preference detection.
 * When theme is 'system', it listens to the user's OS/browser color scheme preference.
 *
 * @param theme - The theme setting: 'light', 'dark', or 'system'
 * @returns The resolved theme: 'light' or 'dark'
 */
export function useResolvedTheme(theme: Theme): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => {
    // Check initial system preference (SSR-safe)
    if (typeof window === 'undefined') {
      return 'light'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    // Only listen to system changes if theme is 'system'
    if (theme !== 'system') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    // Update state based on current value
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    // Listen for changes
    const handler = (e: MediaQueryListEvent): void => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)
    return (): void => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  // Return explicit theme if not 'system', otherwise return detected system theme
  return theme === 'system' ? systemTheme : theme
}
