/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        display: ['Oswald', 'Barlow Condensed', 'var(--font-display)', 'sans-serif'],
        body: ['IBM Plex Mono', 'var(--font-mono)', 'monospace'],
      },
      colors: {
        // ─── Global dark theme ───────────────────────────────────────────
        chalk: '#F0EDE6',
        carbon: '#141414',
        slate: '#1E1E1E',
        steel: '#2A2A2A',
        zinc: '#3A3A3A',
        ash: '#888888',
        ghost: '#AAAAAA',
        accent: '#C8F135',
        warn: '#F5A623',
        crit: '#FF4E4E',
        info: '#4EA8FF',
        // ─── Vendredi / Games theme ─────────────────────────────────────
        // "cream" = off-white background (light theme game screens)
        cream: '#F5F0E8',
        // "ink"   = near-black text / dark elements on light backgrounds
        ink: '#1A1614',
        // "papope" = green accent used on the game's CTAs
        papope: '#C8F135',
        // "muted"  = subdued text on the light game screens
        muted: '#6B6560',
      },
    },
  },
  plugins: [],
}
