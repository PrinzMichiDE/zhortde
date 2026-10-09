'use client';

import { useMemo, useState } from 'react';
import { SPLASH_ANIMATIONS, SplashAnimation } from '@/lib/splash-animations';

type SplashScreenPreviewProps = {
  animationId: string;
  title?: string;
  subtitle?: string;
};

export function SplashScreenPreview({
  animationId,
  title = 'Weiterleitung …',
  subtitle = 'Bitte warten Sie einen Moment',
}: SplashScreenPreviewProps) {
  const [animation] = useState<SplashAnimation | undefined>(
    SPLASH_ANIMATIONS.find((a) => a.id === animationId)
  );

  const resolvedTitle = animation?.name || title;
  const resolvedSubtitle = animation?.description || subtitle;

  const containerStyle: React.CSSProperties = useMemo(() => {
    const backgroundMatch = animation?.html?.match(
      /background\s*:\s*(linear-gradient\([^)]+\))\s*;/i
    );
    const background = backgroundMatch?.[1] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    return { background };
  }, [animation?.html]);

  if (!animation) {
    return (
      <div
        className="flex min-h-[400px] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8"
        style={containerStyle}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">Keine Animation gefunden</p>
          <p className="text-sm">Animation-ID: {animationId}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="splash-preview-container flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-8"
      style={containerStyle}
    >
      {/* Pulse circle */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
        <svg
          className="h-10 w-10 animate-ping text-white"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-white drop-shadow-lg">
        {resolvedTitle}
      </h1>
      <p className="text-sm text-white/80">{resolvedSubtitle}</p>
    </div>
  );
}

export function SplashScreenSelector({
  selectedId,
  onChange,
}: {
  selectedId: string;
  onChange: (id: string) => void;
}) {
  const categories = Array.from(
    new Set(SPLASH_ANIMATIONS.map((a) => a.category))
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Splash-Screen auswählen</h3>
      {categories.map((category) => (
        <div key={category}>
          <h4 className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wider">
            {category}
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SPLASH_ANIMATIONS.filter((a) => a.category === category).map((anim) => (
              <button
                key={anim.id}
                onClick={() => onChange(anim.id)}
                className={`rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                  selectedId === anim.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{anim.preview}</span>
                <p className="mt-1 text-sm font-medium text-gray-700">{anim.name}</p>
                <p className="text-xs text-gray-400">{anim.description}</p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}