import { requireAccess } from '@/lib/withAccess'

export default async function ChroniqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('chronicle')

  return <>{children}</>
}
