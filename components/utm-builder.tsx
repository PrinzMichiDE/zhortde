'use client';

import { useState, useEffect } from 'react';
import { Tag, Copy, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { buildUtmUrl, parseUtmUrl, validateUtmParameters, UTM_TEMPLATES, UTM_MEDIUMS, UTM_SOURCES, UtmParameters } from '@/lib/utm-builder';

type UtmBuilderProps = {
  baseUrl: string;
  onChange: (utmParams: UtmParameters, finalUrl: string) => void;
  initialParams?: UtmParameters;
};

export function UtmBuilder({ baseUrl, onChange, initialParams }: UtmBuilderProps) {
  const [params, setParams] = useState<UtmParameters>(initialParams || {});
  const [finalUrl, setFinalUrl] = useState(baseUrl);
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const newUrl = buildUtmUrl(baseUrl, params);
    setFinalUrl(newUrl);
    
    const validation = validateUtmParameters(params);
    setErrors(validation.errors);
    
    onChange(params, newUrl);
  }, [params, baseUrl, onChange]);

  const handleParamChange = (key: keyof UtmParameters, value: string) => {
    setParams({
      ...params,
      [key]: value || undefined,
    });
  };

  const applyTemplate = (templateKey: string) => {
    const template = UTM_TEMPLATES[templateKey as keyof typeof UTM_TEMPLATES];
    if (template) {
      setParams(template.params);
      setShowTemplates(false);
    }
  };

  const clearParams = () => {
    setParams({});
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasParams = Object.values(params).some(v => v);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">UTM Builder</h3>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <Sparkles className="h-4 w-4" />
          Templates
          {showTemplates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(UTM_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => applyTemplate(key)}
                className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition"
              >
                <div className="font-medium text-sm text-gray-900">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* UTM Parameters Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaign Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Source <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={params.source || ''}
            onChange={(e) => handleParamChange('source', e.target.value)}
            placeholder="e.g., google, newsletter, facebook"
            list="utm-sources"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <datalist id="utm-sources">
            {UTM_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>{source.label}</option>
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">Which site sent the traffic?</p>
        </div>

        {/* Campaign Medium */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Medium <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={params.medium || ''}
            onChange={(e) => handleParamChange('medium', e.target.value)}
            placeholder="e.g., cpc, email, social"
            list="utm-mediums"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <datalist id="utm-mediums">
            {UTM_MEDIUMS.map((medium) => (
              <option key={medium.value} value={medium.value}>{medium.label}</option>
            ))}
          </datalist>
          <p className="text-xs text-gray-500 mt-1">What type of link was used?</p>
        </div>

        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={params.campaign || ''}
            onChange={(e) => handleParamChange('campaign', e.target.value)}
            placeholder="e.g., spring_sale, product_launch"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Specific campaign identifier</p>
        </div>

        {/* Campaign Term (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Term <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={params.term || ''}
            onChange={(e) => handleParamChange('term', e.target.value)}
            placeholder="e.g., running+shoes, paid+keywords"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Paid search keywords</p>
        </div>

        {/* Campaign Content (Optional) */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Content <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={params.content || ''}
            onChange={(e) => handleParamChange('content', e.target.value)}
            placeholder="e.g., logo_link, text_link, header_button"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">Differentiate ads or links pointing to the same URL</p>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <ul className="text-sm text-yellow-800 space-y-1">
            {errors.map((error, idx) => (
              <li key={idx}>⚠️ {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Final URL Preview */}
      {hasParams && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-indigo-900 mb-2">
                Final URL with UTM Parameters
              </label>
              <div className="bg-white border border-indigo-200 rounded-lg p-3 font-mono text-sm text-gray-900 break-all">
                {finalUrl}
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex-shrink-0 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              title="Copy URL"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      {hasParams && (
        <div className="flex justify-end">
          <button
            onClick={clearParams}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear all parameters
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>💡 Pro Tip:</strong> UTM parameters help you track marketing campaign performance in Google Analytics.
          Use consistent naming conventions across your team for better reporting.
        </p>
      </div>
    </div>
  );
}

