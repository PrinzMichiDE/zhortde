'use client';

import { useState, useEffect } from 'react';
import { GlobeAltIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Browser = 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'unknown';

export function ExtensionDownload() {
  const [browser, setBrowser] = useState<Browser>('unknown');
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Einfache Browser-Erkennung
    const userAgent = window.navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('edg/')) {
      setBrowser('edge');
    } else if (userAgent.includes('chrome') && !userAgent.includes('chromium')) {
      setBrowser('chrome');
    } else if (userAgent.includes('firefox')) {
      setBrowser('firefox');
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      setBrowser('safari');
    } else if (userAgent.includes('opr/') || userAgent.includes('opera')) {
      setBrowser('opera');
    }
  }, []);

  const handleDownload = () => {
    // Download starten
    const link = document.createElement('a');
    link.href = '/extensions/zhort-extension.zip';
    link.download = 'zhort-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Anleitung anzeigen
    setShowGuide(true);
  };

  const getBrowserConfig = () => {
    switch (browser) {
      case 'chrome':
        return {
          name: 'Chrome',
          label: 'Zu Chrome hinzufügen',
          icon: '/chrome-logo.svg', // Fallback to generic if not present
          color: 'bg-blue-600 hover:bg-blue-700',
          steps: [
            'Entpacke die heruntergeladene ZIP-Datei.',
            'Öffne chrome://extensions/ in der Adressleiste.',
            'Aktiviere den "Entwicklermodus" oben rechts.',
            'Klicke auf "Entpackte Erweiterung laden" und wähle den Ordner.'
          ]
        };
      case 'edge':
        return {
          name: 'Edge',
          label: 'Für Edge abrufen',
          color: 'bg-slate-700 hover:bg-slate-800',
          steps: [
            'Entpacke die heruntergeladene ZIP-Datei.',
            'Öffne edge://extensions/ in der Adressleiste.',
            'Aktiviere den "Entwicklermodus" im Menü links.',
            'Klicke auf "Entpackte Erweiterung laden" und wähle den Ordner.'
          ]
        };
      case 'firefox':
        return {
          name: 'Firefox',
          label: 'Zu Firefox hinzufügen',
          color: 'bg-orange-600 hover:bg-orange-700',
          steps: [
            'Entpacke die heruntergeladene ZIP-Datei.',
            'Öffne about:debugging#/runtime/this-firefox',
            'Klicke auf "Temporäres Add-on laden".',
            'Wähle die manifest.json Datei im entpackten Ordner.'
          ]
        };
      default:
        return {
          name: 'Browser',
          label: 'Extension herunterladen',
          color: 'bg-indigo-600 hover:bg-indigo-700',
          steps: [
            'Entpacke die heruntergeladene ZIP-Datei.',
            'Öffne die Erweiterungs-Verwaltung deines Browsers.',
            'Aktiviere den Entwicklermodus.',
            'Lade die Erweiterung als "Unpacked" oder "Temporär".'
          ]
        };
    }
  };

  const config = getBrowserConfig();

  return (
    <>
      <div className="flex flex-col items-start gap-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          Browser Erweiterung
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          Kürzen Sie URLs direkt aus Ihrem Browser mit einem Klick.
          <br />
          <span className="text-sm opacity-70">Erkannt: {config.name}</span>
        </p>
        
        <button 
          onClick={handleDownload}
          className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${config.color} transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
        >
          {browser !== 'unknown' && <ArrowDownTrayIcon className="h-5 w-5 mr-2" />}
          {config.label}
        </button>
      </div>

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Installation in {config.name}
                </h3>
                <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Da Zhort noch nicht im {config.name} Store gelistet ist, müssen Sie den Entwicklermodus nutzen.
                </div>

                <ol className="list-decimal list-inside space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  {config.steps.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => setShowGuide(false)}
                  className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
