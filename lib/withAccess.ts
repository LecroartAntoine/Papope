import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from './authOptions'

export async function requireAccess(section: string) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (!session.user.sections?.includes(section)) {
    redirect('/')
  }
}
