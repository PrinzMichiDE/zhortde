import { LinkForm } from '@/components/link-form';

export default function Home() {

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 mb-6 animate-gradient bg-[length:200%_auto] hover:scale-105 transition-transform duration-500">
            Verkürzen Sie Ihre URLs
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Schnell, einfach und kostenlos - mit Passwortschutz, Ablaufdatum und QR-Codes
          </p>
        </div>

        <LinkForm />

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group hover:transform hover:scale-110 transition-all duration-300 cursor-pointer p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-2xl mb-4 group-hover:shadow-2xl group-hover:shadow-indigo-300/50 dark:group-hover:shadow-indigo-500/30 transition-all duration-300 group-hover:rotate-3">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🔒</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Passwortschutz</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Schützen Sie sensible Links mit Passwörtern</p>
          </div>
          <div className="text-center group hover:transform hover:scale-110 transition-all duration-300 cursor-pointer p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-2xl mb-4 group-hover:shadow-2xl group-hover:shadow-green-300/50 dark:group-hover:shadow-green-500/30 transition-all duration-300 group-hover:rotate-3">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">⏰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Ablaufdatum</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Links automatisch nach Zeit löschen</p>
          </div>
          <div className="text-center group hover:transform hover:scale-110 transition-all duration-300 cursor-pointer p-6 rounded-2xl hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-2xl mb-4 group-hover:shadow-2xl group-hover:shadow-blue-300/50 dark:group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:rotate-3">
              <span className="text-4xl group-hover:scale-110 transition-transform duration-300">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">QR-Codes</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Automatische QR-Codes für jeden Link</p>
          </div>
        </div>
      </div>
    </div>
  );
}
