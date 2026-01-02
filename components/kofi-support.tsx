'use client';

import { useState } from 'react';
import { Heart, Coffee, Sparkles, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface KofiSupportProps {
  variant?: 'compact' | 'full' | 'banner';
  showMonthly?: boolean;
}

export function KofiSupport({ variant = 'full', showMonthly = true }: KofiSupportProps) {
  const [hovered, setHovered] = useState<'one-time' | 'monthly' | null>(null);
  const kofiUrl = 'https://ko-fi.com/michelfritzsch';
  const monthlyUrl = 'https://ko-fi.com/michelfritzsch/tiers';

  if (variant === 'compact') {
    return (
      <a
        href={kofiUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B6B] hover:from-[#FF4A47] hover:to-[#FF5E5B] text-white rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
      >
        <Coffee className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
        <span>Support</span>
      </a>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF5E5B] via-[#FF6B6B] to-[#FF8785] p-6 shadow-2xl border-2 border-[#FF5E5B]/20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Unterstütze dieses Projekt</h3>
              <p className="text-white/90 text-sm">Hilf uns, Zhort kostenlos und werbefrei zu halten</p>
            </div>
          </div>
          <div className="flex gap-3">
            <a
              href={kofiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-white text-[#FF5E5B] rounded-xl font-bold hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Einmalig unterstützen
            </a>
            {showMonthly && (
              <a
                href={monthlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold hover:bg-white/30 transition-all duration-300 transform hover:scale-105"
              >
                Monatlich unterstützen
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-8 shadow-2xl border-2 border-gradient-to-r from-[#FF5E5B]/20 to-[#FF6B6B]/20 bg-gradient-to-br from-white via-[#FFF5F5] to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF5E5B]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#FF6B6B]/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#FF5E5B] to-[#FF6B6B] rounded-full shadow-lg">
            <Heart className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#FF5E5B] to-[#FF6B6B] dark:from-[#FF6B6B] dark:to-[#FF8785] bg-clip-text text-transparent">
            Unterstütze dieses Projekt
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Zhort ist kostenlos und werbefrei. Deine Unterstützung hilft uns, die Plattform weiterzuentwickeln und neue Features hinzuzufügen.
          </p>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* One-time Support */}
          <a
            href={kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            onMouseEnter={() => setHovered('one-time')}
            onMouseLeave={() => setHovered(null)}
            className="group relative p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-[#FF5E5B] dark:hover:border-[#FF6B6B] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E5B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-lg transition-all duration-300 ${
                  hovered === 'one-time' 
                    ? 'bg-gradient-to-br from-[#FF5E5B] to-[#FF6B6B] scale-110' 
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  <Gift className={`w-6 h-6 transition-colors duration-300 ${
                    hovered === 'one-time' ? 'text-white' : 'text-[#FF5E5B] dark:text-[#FF6B6B]'
                  }`} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Einmalige Unterstützung
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Unterstütze uns mit einem einmaligen Beitrag. Jeder Betrag hilft!
              </p>
              <div className="flex items-center gap-2 text-[#FF5E5B] dark:text-[#FF6B6B] font-semibold">
                <span>Jetzt unterstützen</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </a>

          {/* Monthly Support */}
          {showMonthly && (
            <a
              href={monthlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHovered('monthly')}
              onMouseLeave={() => setHovered(null)}
              className="group relative p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-[#FF5E5B] dark:hover:border-[#FF6B6B] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E5B]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-lg transition-all duration-300 ${
                    hovered === 'monthly' 
                      ? 'bg-gradient-to-br from-[#FF5E5B] to-[#FF6B6B] scale-110' 
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Sparkles className={`w-6 h-6 transition-colors duration-300 ${
                      hovered === 'monthly' ? 'text-white' : 'text-[#FF5E5B] dark:text-[#FF6B6B]'
                    }`} />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Monatliche Unterstützung
                  </h4>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  Werde ein regelmäßiger Unterstützer und hilf uns langfristig zu wachsen.
                </p>
                <div className="flex items-center gap-2 text-[#FF5E5B] dark:text-[#FF6B6B] font-semibold">
                  <span>Monatlich unterstützen</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-8 p-6 bg-gradient-to-r from-[#FFF5F5] to-[#FFF0F0] dark:from-gray-800/50 dark:to-gray-800/30 rounded-xl border border-[#FF5E5B]/20">
          <div className="flex items-start gap-4">
            <Coffee className="w-6 h-6 text-[#FF5E5B] dark:text-[#FF6B6B] mt-1 flex-shrink-0" />
            <div>
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Warum unterstützen?
              </h5>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Hilf uns, Zhort kostenlos und werbefrei zu halten</li>
                <li>• Unterstütze die Entwicklung neuer Features</li>
                <li>• Ermögliche bessere Server-Performance und Zuverlässigkeit</li>
                <li>• Zeige deine Wertschätzung für unsere Arbeit</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
