import { requireAccess } from '@/lib/withAccess'
import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ionickel — Ioniq PHEV tracker',
  description: 'Hyundai Ioniq PHEV 2021 — maintenance, trips & fuel tracker',
}

// Simple icon components (inline SVG — no extra dep needed)
function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

const NAV = [
  { href: '/ionickel',       label: 'Dashboard',   icon: 'M4 6h16M4 12h16M4 18h16' },
  { href: '/ionickel/maintenance', label: 'Maintenance', icon: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' },
  { href: '/ionickel/trips', label: 'Trips',        icon: 'M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3' },
  { href: '/ionickel/fuel',  label: 'Fuel & Energy',icon: 'M3 22V8l9-6 9 6v14M10 22v-5h4v5' },
  { href: '/ionickel/log',   label: 'Service log',  icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2' },
]

export default async function IonikelLayout({ children }: { children: React.ReactNode }) {
  await requireAccess('ionickel')

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">⚡ Ionickel</div>
          <div className="logo-sub">Ioniq PHEV 2021</div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ href, label, icon }) => (
            <Link key={href} href={href} className="nav-link">
              <Icon path={icon} />
              {label}
            </Link>
          ))}

          <Link href="/" className="nav-link">
            <Icon path="M19 12H5M12 19l-7-7 7-7" />
            Back to app
          </Link>
        </nav>

        {/* Odometer — will be hydrated client-side; starts with placeholder */}
        <div className="sidebar-odo">
          <div className="odo-label">Odometer</div>
          <div className="odo-value" id="sidebar-km">
            — <span className="odo-unit">km</span>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="page-main">
        {children}
      </main>
    </div>
  )
}