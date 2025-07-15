import { createSharedPathnamesNavigation } from 'next-intl/navigation'

export const locales = ['tr', 'en'] as const
export const defaultLocale = 'tr' as const

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales }) 