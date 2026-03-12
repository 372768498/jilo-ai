'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CopyPromptButtonProps = {
  text: string;
  copiedLabel?: string;
  copyLabel?: string;
  className?: string;
};

export default function CopyPromptButton({
  text,
  copiedLabel = 'Copied',
  copyLabel = 'Copy',
  className,
}: CopyPromptButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleCopy} className={className}>
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? copiedLabel : copyLabel}
    </Button>
  );
}
