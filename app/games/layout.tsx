export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Oswald:wght@700;800;900&family=IBM+Plex+Mono:wght@400;700&display=swap');

        .papope-root {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e8e4dd;
          font-family: 'IBM Plex Mono', monospace;
          overflow-x: hidden;
          position: relative;
        }

        .title-font { font-family: 'Oswald', sans-serif; }
        .vt-font { font-family: 'VT323', monospace; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="papope-root">{children}</div>
    </>
  )
}
