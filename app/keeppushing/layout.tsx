import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Keep Pushing !',
  description: 'Suivi sport, nutrition et bien-être',
}

export default function KeepPushingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
