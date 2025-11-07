'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Switch, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';

const LANGUAGES = [
  { value: '', label: 'Keine Syntax-Hervorhebung' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'bash', label: 'Bash' },
];

export default function CreatePastePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState(LANGUAGES[0]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          syntaxHighlightingLanguage: language.value || null,
          isPublic,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Paste');
      }

      router.push(`/p/${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-100 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Neues Paste erstellen
            </h1>
            <p className="text-gray-600">Teilen Sie Code-Snippets und Text mit Syntax-Highlighting 📝</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="content" className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>💻</span>
                <span>Inhalt</span>
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Fügen Sie hier Ihren Code oder Text ein..."
                required
                rows={15}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-900 placeholder-gray-500 font-mono text-sm transition-all duration-300 hover:border-indigo-400 resize-y"
              />
              <p className="mt-2 text-xs text-gray-600 font-medium">Tipp: Sie können die Größe des Textfelds anpassen</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>🎨</span>
                <span>Programmiersprache (optional)</span>
              </label>
              <Listbox value={language} onChange={setLanguage}>
                <div className="relative">
                  <ListboxButton className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-indigo-400 transition-all duration-300 font-medium text-gray-900">
                    <span className="block truncate">{language.label}</span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                    </span>
                  </ListboxButton>
                  <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-200">
                    {LANGUAGES.map((lang) => (
                      <ListboxOption
                        key={lang.value}
                        value={lang}
                        className="relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-gray-900 data-[focus]:bg-gradient-to-r data-[focus]:from-indigo-50 data-[focus]:to-purple-50 data-[focus]:text-indigo-900 transition-colors"
                      >
                        {({ selected }) => (
                          <>
                            <span className={`block truncate ${selected ? 'font-semibold' : 'font-medium'}`}>
                              {lang.label}
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                <CheckIcon className="h-5 w-5" />
                              </span>
                            )}
                          </>
                        )}
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>

            {session && (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <span>👁️</span>
                  <span>Öffentlich (für alle sichtbar)</span>
                </span>
                <Switch
                  checked={isPublic}
                  onChange={setIsPublic}
                  className={`group relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 ${
                    isPublic ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-400'
                  }`}
                >
                  <span className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out group-data-[checked]:translate-x-5" />
                </Switch>
              </div>
            )}

            {error && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-700 font-semibold text-sm">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird erstellt...
                </span>
              ) : (
                'Paste erstellen 🚀'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

