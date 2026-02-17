import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Mono'", "monospace"],
        body: ["'DM Sans'", "sans-serif"],
      },
      colors: {
        cream: "#F5F0E8",
        ink: "#1A1614",
        papope: "#FF3B30",
        accent: "#FFD60A",
        muted: "#8B7E74",
      },
      keyframes: {
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(2px, -2px)" },
          "60%": { transform: "translate(-1px, 1px)" },
          "80%": { transform: "translate(1px, -1px)" },
        },
        shake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-3deg) scale(1.05)" },
          "75%": { transform: "rotate(3deg) scale(1.05)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "score-pop": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(-20px)", opacity: "0" },
        },
        countdown: {
          "0%": { transform: "scale(1.5)", opacity: "0" },
          "20%": { transform: "scale(1)", opacity: "1" },
          "80%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.5)", opacity: "0" },
        },
        "head-spawn": {
          "0%": { transform: "scale(0) rotate(-20deg)", opacity: "0" },
          "60%": { transform: "scale(1.2) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        splat: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.8) rotate(10deg)" },
          "60%": { transform: "scale(1.3) rotate(-5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
      },
      animation: {
        glitch: "glitch 0.3s ease-in-out infinite",
        shake: "shake 0.5s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "score-pop": "score-pop 0.6s ease-out forwards",
        countdown: "countdown 0.8s ease-in-out forwards",
        "head-spawn": "head-spawn 0.3s ease-out forwards",
        splat: "splat 0.2s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
