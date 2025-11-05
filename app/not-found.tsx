import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Seite nicht gefunden
      </h2>
      <p className="text-gray-600 mb-8">
        Die angeforderte Seite existiert nicht oder wurde gelöscht.
      </p>
      <Link
        href="/"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
      >
        Zurück zur Startseite
      </Link>
    </div>
  );
}

