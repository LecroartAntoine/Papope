import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papope — by LeBonCassoulet",
  description: "Des jeux absurdes pour des gens sérieux.",
  openGraph: {
    title: "Papope — by LeBonCassoulet",
    description: "Des jeux absurdes pour des gens sérieux.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
