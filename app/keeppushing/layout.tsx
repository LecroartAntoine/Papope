import type { Metadata } from 'next'
import { requireAccess } from '@/lib/withAccess'

export const metadata: Metadata = {
  title: 'Keep Pushing !',
  description: 'Suivi sport, nutrition et bien-être',
}

export default async function KeepPushingLayout({ children }: { children: React.ReactNode }) {
  await requireAccess('keeppushing')

  return <>{children}</>
}
