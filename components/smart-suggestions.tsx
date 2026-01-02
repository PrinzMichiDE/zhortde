'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Tag, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartSuggestionsProps {
  longUrl: string;
  onShortCodeSelect?: (shortCode: string) => void;
  onTagsSelect?: (tags: string[]) => void;
}

export function SmartSuggestions({ longUrl, onShortCodeSelect, onTagsSelect }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{
    shortCodes: string[];
    tags: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (longUrl && longUrl.length > 10) {
      fetchSuggestions();
    }
  }, [longUrl]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(newTags);
    onTagsSelect?.(newTags);
  };

  if (!suggestions || (suggestions.shortCodes.length === 0 && suggestions.tags.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Suggestions</h3>
      </div>

      {suggestions.shortCodes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Short Code Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.shortCodes.map((code, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onShortCodeSelect?.(code)}
                className="text-xs font-mono"
              >
                {code}
              </Button>
            ))}
          </div>
        </div>
      )}

      {suggestions.tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.tags.map((tag, index) => (
              <Button
                key={index}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                size="sm"
                onClick={() => handleTagToggle(tag)}
                className="text-xs"
              >
                {tag}
                {selectedTags.includes(tag) && ' ✓'}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
