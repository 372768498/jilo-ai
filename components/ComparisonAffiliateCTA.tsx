'use client';

import { ExternalLink, Sparkles } from 'lucide-react';

type Tool = {
  name: string;
  slug: string;
  affiliateUrl?: string;
  dealText?: string;
  commission?: string;
};

export default function ComparisonAffiliateCTA({ toolA, toolB }: { toolA: Tool; toolB: Tool }) {
  const hasAnyAffiliate = toolA.affiliateUrl || toolB.affiliateUrl;
  if (!hasAnyAffiliate) return null;

  return (
    <div className="my-12 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 dark:border-indigo-800 p-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
          Ready to Try?
        </h3>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Get started with exclusive deals on the tools compared above.
      </p>
      
      <div className="grid md:grid-cols-2 gap-4">
        {[toolA, toolB].map((tool) => (
          tool.affiliateUrl ? (
            <a
              key={tool.slug}
              href={tool.affiliateUrl}
              target="_blank"
              rel="noopener sponsored"
              className="group flex flex-col items-center p-6 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:shadow-lg transition-all"
            >
              <span className="text-lg font-bold mb-1 group-hover:text-indigo-600 transition-colors">
                {tool.name}
              </span>
              {tool.dealText && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium mb-3">
                  {tool.dealText}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium group-hover:bg-indigo-700 transition-colors">
                Try {tool.name} Free <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          ) : (
            <div
              key={tool.slug}
              className="flex flex-col items-center p-6 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
            >
              <span className="text-lg font-bold mb-1">{tool.name}</span>
              <span className="text-sm text-muted-foreground">Visit website directly</span>
            </div>
          )
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 text-center">
        * Some links are affiliate links. We may earn a commission at no extra cost to you.
      </p>
    </div>
  );
}
