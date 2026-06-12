import { requireAccess } from '@/lib/withAccess'
import styles from './chronicleLayout.module.css'

export default async function ChroniqueLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAccess('chronicle')

  // Safe deterministic math (runs on the server, matches client output)
  const stars = Array.from({ length: 180 }, (_, i) => {
    const r = (seed: number) => Math.abs(Math.sin(seed) * 10000) % 1;
    return {
      x: r(i * 12.9898) * 100,
      y: r(i * 78.233) * 100,
      size: 0.8 + Math.pow(r(i * 43.21), 4) * 2.5, // Natural size variety
      op: 0.2 + r(i * 91.34) * 0.8,
      dur: 3 + r(i * 55.55) * 4,
      delay: r(i * 33.33) * -5, // Negative delay so stars start pre-twinkled
    };
  });

  return (
    <div className={styles.chronicleWrapper}>
      {/* Background Starfield */}
      <div className={styles.chronicleStars}>
        {stars.map((s, i) => (
          <div
            key={i}
            className={styles.cstar}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              ['--op' as string]: s.op,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* GPU-Accelerated Drifting Fog */}
      <div className={styles.fogContainer}>
        <div className={styles.fogLayer1} />
        <div className={styles.fogLayer2} />
      </div>

      {/* Main Page Content */}
      <div className={styles.contentContainer}>
        {children}
      </div>
    </div>
  )
}