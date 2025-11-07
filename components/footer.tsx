'use client';

import { useState, useEffect, useRef } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

export function Footer() {
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [linkCount, setLinkCount] = useState<number>(0);
  const [animatedVisitors, setAnimatedVisitors] = useState<number>(0);
  const [animatedLinks, setAnimatedLinks] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const footerRef = useRef<HTMLElement>(null);

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
    return num.toLocaleString('de-DE');
  };

  return (
    <footer 
      ref={footerRef}
      className={`bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white mt-auto overflow-hidden transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
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
            <h3 className="text-lg font-semibold mb-3 text-indigo-400 flex items-center justify-center md:justify-start">
              <span className="inline-block animate-pulse">📊</span>
              <span className="ml-2">Statistiken</span>
            </h3>
            <div className="space-y-4">
              <div className="group flex items-center justify-center md:justify-start space-x-2 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-400/20">
                <svg className="w-5 h-5 text-green-400 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                <span className="text-xl font-bold text-white tabular-nums group-hover:text-green-400 transition-colors">
                  {formatNumber(animatedVisitors)}
                </span>
                <span className="text-gray-400 text-sm group-hover:text-green-300 transition-colors">Besucher</span>
              </div>
              <div className="group flex items-center justify-center md:justify-start space-x-2 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-400/20">
                <svg className="w-5 h-5 text-blue-400 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-bold text-white tabular-nums group-hover:text-blue-400 transition-colors">
                  {formatNumber(animatedLinks)}
                </span>
                <span className="text-gray-400 text-sm group-hover:text-blue-300 transition-colors">Links</span>
              </div>
            </div>
          </div>

          {/* Zhort Info */}
          <div 
            className={`text-center transform transition-all duration-700 delay-300 ${
              isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2 animate-gradient bg-[length:200%_auto] hover:scale-110 transition-transform duration-300">
              Zhort
            </h3>
            <p className="text-gray-400 text-sm hover:text-gray-300 transition-colors duration-300">
              Kostenloser URL Shortener & Pastebin
            </p>
            <p className="text-gray-500 text-xs mt-2 hover:text-gray-400 transition-colors duration-300">
              © {new Date().getFullYear()} Zhort. Alle Rechte vorbehalten.
            </p>
          </div>

          {/* Spenden */}
          <div 
            className={`text-center md:text-right transform transition-all duration-700 delay-500 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <h3 className="text-lg font-semibold mb-3 text-indigo-400 flex items-center justify-center md:justify-end">
              <HeartIcon className="w-5 h-5 mr-2 text-red-400 animate-pulse hover:scale-125 transition-transform duration-300" />
              Unterstützen
            </h3>
            <div className="space-y-3 flex flex-col items-center md:items-end">
              <a
                href="http://paypal.me/michelfritzsch"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 relative overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer"></span>
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.805.805 0 01-.794.679H7.72a.483.483 0 01-.477-.558L7.418 21h1.518l.95-6.02h1.385c4.678 0 7.75-2.203 8.796-6.502z"/>
                  <path d="M2.379 0h9.6a3.968 3.968 0 013.637 2.31c.394.914.448 1.992.14 3.19l-.168.656c-.784 3.074-2.953 4.582-6.453 4.582H7.038a.965.965 0 00-.951.81l-1.093 6.927a.577.577 0 01-.57.488H.92a.289.289 0 01-.286-.336L2.103.596A.965.965 0 013.054 0h-.675z"/>
                </svg>
                <span className="font-semibold">PayPal Spende</span>
              </a>
              
              <a
                href="https://www.amazon.de/hz/wishlist/ls/36YXSNRT3MAQZ?ref_=wl_share"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-2xl hover:shadow-orange-500/50 relative overflow-hidden"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer"></span>
                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.5 0c1.657 0 3 1.343 3 3v18c0 1.657-1.343 3-3 3h-13c-1.657 0-3-1.343-3-3V3c0-1.657 1.343-3 3-3h13zm-3.5 11c0-.552-.448-1-1-1s-1 .448-1 1 .448 1 1 1 1-.448 1-1zm-4-1c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1zm-4 1c0-.552-.448-1-1-1s-1 .448-1 1 .448 1 1 1 1-.448 1-1z"/>
                </svg>
                <span className="font-semibold">Wunschzettel</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className={`mt-8 pt-6 border-t border-gray-700 transform transition-all duration-700 delay-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="mb-4 md:mb-0 flex items-center gap-1">
              <a 
                href="/api" 
                className="hover:text-indigo-400 transition-all duration-300 hover:scale-110 inline-block relative group"
              >
                <span className="relative z-10">API Dokumentation</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
              <span className="mx-2 animate-pulse">•</span>
              <a 
                href="/dashboard" 
                className="hover:text-indigo-400 transition-all duration-300 hover:scale-110 inline-block relative group"
              >
                <span className="relative z-10">Dashboard</span>
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </a>
            </div>
            <div className="flex items-center gap-2 group">
              <span>Made with</span>
              <span className="inline-block text-red-500 animate-pulse group-hover:scale-125 group-hover:animate-bounce transition-transform duration-300">❤</span>
              <span>by</span>
              <span className="font-semibold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">Michel</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

