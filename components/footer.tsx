'use client';

import { useState, useEffect, useRef } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { CookieSettingsButton } from './cookie-settings-button';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export function Footer() {
  const pathname = usePathname();
  const hideChrome = pathname === '/bio' || pathname.startsWith('/bio/');
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [linkCount, setLinkCount] = useState<number>(0);
  const [animatedVisitors, setAnimatedVisitors] = useState<number>(0);
  const [animatedLinks, setAnimatedLinks] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const footerRef = useRef<HTMLElement>(null);
  const t = useTranslations('footer');
  const locale = useLocale();

  useEffect(() => {
    if (hideChrome) return;
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
  }, [hideChrome]);

  // Intersection Observer für Fade-In beim Scrollen
  useEffect(() => {
    if (hideChrome) return;
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
      const node = footerRef.current;
      if (node) {
        observer.unobserve(node);
      }
    };
  }, [hideChrome]);

  // Animierte Zähler
  useEffect(() => {
    if (hideChrome) return;
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
  }, [hideChrome, visitorCount, isVisible]);

  useEffect(() => {
    if (hideChrome) return;
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
  }, [hideChrome, linkCount, isVisible]);

  const formatNumber = (num: number) => {
    return num.toLocaleString(locale);
  };

  // Link-in-bio pages should look like Linktree: no global chrome.
  if (hideChrome) return null;

  return (
    <footer 
      ref={footerRef}
      className={`bg-card border-t border-border mt-auto overflow-hidden transition-all duration-1000 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Statistiken */}
          <div 
            className={`text-center md:text-left transform transition-all duration-700 delay-100 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center justify-center md:justify-start">
              <span className="inline-block animate-pulse">📊</span>
              <span className="ml-2">{t('statistics')}</span>
            </h3>
            <div className="space-y-4">
              <div className="group flex items-center justify-center md:justify-start space-x-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-300 hover:scale-105">
                <svg className="w-5 h-5 text-primary group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {formatNumber(animatedVisitors)}
                </span>
                <span className="text-muted-foreground text-sm">{t('visitors')}</span>
              </div>
              <div className="group flex items-center justify-center md:justify-start space-x-2 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-300 hover:scale-105">
                <svg className="w-5 h-5 text-primary group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {formatNumber(animatedLinks)}
                </span>
                <span className="text-muted-foreground text-sm">{t('links')}</span>
              </div>
            </div>
          </div>

          {/* Zhort Info */}
          <div 
            className={`text-center transform transition-all duration-700 delay-300 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2 animate-gradient bg-[length:200%_auto] hover:scale-110 transition-transform duration-300">
              Zhort
            </h3>
            <p className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-300">
              {t('freeService')}
            </p>
            <p className="text-muted-foreground/60 text-xs mt-2 hover:text-muted-foreground transition-colors duration-300">
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
                  className="group inline-flex items-center px-5 py-2.5 bg-[#0070BA] hover:bg-[#005ea6] text-white rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg relative overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></span>
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .76-.654h6.264c2.09 0 3.792.426 4.885 1.274 1.015.789 1.572 1.953 1.572 3.35 0 .146-.006.297-.02.452-.018.166-.043.337-.075.514-.276 1.544-.963 2.844-1.92 3.655-1.02.861-2.386 1.297-4.062 1.297H9.83a.765.765 0 0 0-.755.654l-.003.016-.85 5.393-.003.017a.64.64 0 0 1-.633.54h-.51z"/>
                    <path d="M18.429 7.79c-.031.175-.068.354-.11.538-.623 2.956-2.598 4.155-5.165 4.155h-1.307a.635.635 0 0 0-.627.54l-.67 4.245-.19 1.205a.334.334 0 0 0 .33.39h2.319a.559.559 0 0 0 .551-.47l.023-.118.436-2.766.028-.153a.559.559 0 0 1 .55-.469h.348c2.244 0 4.001-1.048 4.514-4.08.214-1.27.103-2.328-.463-3.072z"/>
                  </svg>
                  <span className="font-semibold">PayPal</span>
                </a>
                <a
                  href="https://www.michelfritzsch.de/unterstuetzen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg relative overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></span>
                  <HeartIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-semibold">{t('moreOptions')}</span>
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
