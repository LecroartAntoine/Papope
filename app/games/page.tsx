'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function GamesPortal() {
  const { t } = useI18n()

  const games = [
    {
      id: 'vendredi',
      title: t('games.friday'),
      desc: t('games.macronCloning'),
      href: "/games/vendredi",
      image: "images/macron.png"
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e8e4dd] font-mono p-8 flex flex-col items-center justify-center relative">
      <div className="fixed
          bottom-5
          left-1/2
          -translate-x-1/2">
        <Link href="/" className="text-[#888] hover:text-[#e8e4dd] transition-colors text-sm">
          {t('games.backToHome')}
        </Link>
      </div>
      
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center uppercase tracking-widest text-[#c8f135]">
          {t('games.gamesPortal')}
        </h1>
        
        <p className="text-[#888] text-center mb-12 text-sm italic">
          {t('games.chooseYourPoison')}
        </p>

        <div className="grid gap-6">
          {games.map(g => (
            <Link 
              key={g.id} 
              href={g.href}
              className="bg-[#111] border border-[#333] hover:border-[#666] p-6 transition-all hover:-translate-y-1 block group"
            >
              <div className="flex items-center gap-6">
                <img src={g.image} className="group-hover:scale-110 transition-transform max-h-20"/>
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-wider text-[#e8e4dd] mb-2">{g.title}</h2>
                  <p className="text-[#888] text-sm leading-relaxed">{g.desc}</p>
                </div>
              </div>
            </Link>
          ))}
          
          <div className="bg-[#111] border border-[#222] p-6 opacity-40 cursor-not-allowed relative overflow-hidden">
            <div className="absolute top-2 right-4 text-[#666] text-xs tracking-widest">SOON™</div>
            <div className="flex items-center gap-6 grayscale">
              <span className="text-5xl">❓</span>
              <div>
                <h2 className="text-2xl font-bold uppercase tracking-wider text-[#888] mb-2">{t('games.nextGame')}</h2>
                <p className="text-[#666] text-sm">{t('games.inDevelopment')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
