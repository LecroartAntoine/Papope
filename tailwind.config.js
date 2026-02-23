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
        display: ['var(--font-display)', 'serif'],
      },
      colors: {
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
      }
    },
  },
  plugins: [],
}
