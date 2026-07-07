'use client'

import { SessionProvider } from 'next-auth/react'
import { I18nProvider } from '@/lib/i18n/context'
import { GlobalHeader } from '@/components/GlobalHeader/GlobalHeader'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SessionProvider>
        <GlobalHeader />
        {children}
      </SessionProvider>
    </I18nProvider>
  )
}
