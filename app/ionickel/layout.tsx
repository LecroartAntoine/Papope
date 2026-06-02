import { requireAccess } from '@/lib/withAccess'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ioniq PHEV Maintenance',
  description: 'Hyundai Ioniq PHEV 2021 — maintenance tracker',
}

export default async function IonikelLayout({ children }: { children: React.ReactNode }) {
  await requireAccess('ionickel')

  return <>{children}</>
}
