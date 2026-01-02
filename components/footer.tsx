'use client';

import { useState, useEffect, useRef } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { CookieSettingsButton } from './cookie-settings-button';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [linkCount, setLinkCount] = useState<number>(0);
  const [animatedVisitors, setAnimatedVisitors] = useState<number>(0);
  const [animatedLinks, setAnimatedLinks] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const footerRef = useRef<HTMLElement>(null);
  const t = useTranslations('footer');
  const locale = useLocale();

  useEffect(() => {
    // Lade oder initialisiere Statistiken
    const loadStats = async () => {
      try {
        const response = await fetch('/api/counter', {
          method: 'POST',
        });
        const data = await response.json();
        setVisitorCount(data.visitors || 0);
        setLinkCount(data.links || 0);
      } catch (error) {
        console.error('Error loading stats:', error);
        // Fallback-Werte bei Fehler
        setVisitorCount(126819);
        setLinkCount(126819);
      }
    };

    loadStats();
  }, []);

  // Intersection Observer für Fade-In beim Scrollen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => {
      if (footerRef.current) {
        observer.unobserve(footerRef.current);
      }
    };
  }, []);

  // Animierte Zähler
  useEffect(() => {
    if (!isVisible || visitorCount === 0) return;

    const duration = 2000; // 2 Sekunden
    const steps = 60;
    const increment = visitorCount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= visitorCount) {
        setAnimatedVisitors(visitorCount);
        clearInterval(timer);
      } else {
        setAnimatedVisitors(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [visitorCount, isVisible]);

  useEffect(() => {
    if (!isVisible || linkCount === 0) return;

    const duration = 2000;
    const steps = 60;
    const increment = linkCount / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= linkCount) {
        setAnimatedLinks(linkCount);
        clearInterval(timer);
      } else {
        setAnimatedLinks(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [linkCount, isVisible]);

  const formatNumber = (num: number) => {
    return num.toLocaleString(locale);
  };

  return (
    <footer 
      ref={footerRef}
      className={`bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t-2 border-gray-200 dark:border-gray-800 mt-auto overflow-hidden transition-all duration-1000 shadow-lg ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Statistiken */}
          <div 
            className={`text-center md:text-left transform transition-all duration-700 delay-100 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 flex items-center justify-center md:justify-start">
              <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg mr-2">
                <span className="text-lg">📊</span>
              </div>
              <span>{t('statistics')}</span>
            </h3>
            <div className="space-y-3">
              <div className="group flex items-center justify-center md:justify-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-2 border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatNumber(animatedVisitors)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('visitors')}</div>
                </div>
              </div>
              <div className="group flex items-center justify-center md:justify-start gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                    {formatNumber(animatedLinks)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">{t('links')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Zhort Info */}
          <div 
            className={`text-center transform transition-all duration-700 delay-300 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">Z</span>
              </div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                Zhort
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
              {t('freeService')}
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-xs">
              © {new Date().getFullYear()} Zhort. {t('allRightsReserved')}
            </p>
          </div>

          {/* Spenden */}
          <div 
            className={`text-center md:text-right transform transition-all duration-700 delay-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center justify-center md:justify-end">
              <HeartIcon className="w-5 h-5 mr-2 text-destructive animate-pulse hover:scale-125 transition-transform duration-300" />
              {t('support')}
            </h3>
            <div className="space-y-3 flex flex-col items-center md:items-end">
              <p className="text-sm text-muted-foreground mb-2 max-w-xs">
                {t('supportText')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="https://www.paypal.com/paypalme/michelfritzsch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#0070BA] to-[#005ea6] hover:from-[#005ea6] hover:to-[#004a8c] text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden font-semibold"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></span>
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .76-.654h6.264c2.09 0 3.792.426 4.885 1.274 1.015.789 1.572 1.953 1.572 3.35 0 .146-.006.297-.02.452-.018.166-.043.337-.075.514-.276 1.544-.963 2.844-1.92 3.655-1.02.861-2.386 1.297-4.062 1.297H9.83a.765.765 0 0 0-.755.654l-.003.016-.85 5.393-.003.017a.64.64 0 0 1-.633.54h-.51z"/>
                    <path d="M18.429 7.79c-.031.175-.068.354-.11.538-.623 2.956-2.598 4.155-5.165 4.155h-1.307a.635.635 0 0 0-.627.54l-.67 4.245-.19 1.205a.334.334 0 0 0 .33.39h2.319a.559.559 0 0 0 .551-.47l.023-.118.436-2.766.028-.153a.559.559 0 0 1 .55-.469h.348c2.244 0 4.001-1.048 4.514-4.08.214-1.27.103-2.328-.463-3.072z"/>
                  </svg>
                  <span>PayPal</span>
                </a>
                <a
                  href="https://www.michelfritzsch.de/unterstuetzen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden font-semibold"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></span>
                  <HeartIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span>{t('moreOptions')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className={`mt-8 pt-6 border-t border-border transform transition-all duration-700 delay-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <div className="mb-4 md:mb-0 flex flex-wrap items-center justify-center gap-2">
              <a 
                href="/api" 
                className="hover:text-primary transition-all duration-300 hover:scale-110 inline-block relative group"
              >
                <span className="relative z-10">{t('apiDocs')}</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
              <span className="mx-1 animate-pulse">•</span>
              <a 
                href="/dashboard" 
                className="hover:text-primary transition-all duration-300 hover:scale-110 inline-block relative group"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
              <span className="mx-1 animate-pulse">•</span>
              <a 
                href="/datenschutz" 
                className="hover:text-primary transition-all duration-300 hover:scale-110 inline-block relative group"
              >
                <span className="relative z-10">{t('cookieSettings')}</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-primary to-primary/60 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
              <span className="mx-1 animate-pulse">•</span>
              <CookieSettingsButton />
            </div>
            <div className="flex items-center gap-2 group">
              <span>{t('madeWith')}</span>
              <span className="inline-block text-destructive animate-pulse group-hover:scale-125 group-hover:animate-bounce transition-transform duration-300">❤</span>
              <span>{t('by')}</span>
              <span className="font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent transition-all duration-300">Michel</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
