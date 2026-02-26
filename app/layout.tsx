import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Papope',
  description: 'Mon coin sur internet.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-title" content="Papope" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
