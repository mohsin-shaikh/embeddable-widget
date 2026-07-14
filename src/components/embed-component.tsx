import { useEffect, useRef, useState } from 'react';

import { ensureFontFaces } from '../lib/font-loader-module';

export type EmbedWidgetComponentProps = {
  heading?: string;
  ctaLabel?: string;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onCta?: () => void;
};

export function EmbedWidgetComponent({
  heading = 'Embed Widget',
  ctaLabel = 'Get Started',
  onReady,
  onError,
  onCta,
}: EmbedWidgetComponentProps) {
  const [fontsReady, setFontsReady] = useState(false);
  const [fontsFailed, setFontsFailed] = useState(false);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);

  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;

    void ensureFontFaces(document)
      .then(() => {
        if (cancelled) {
          return;
        }

        setFontsReady(true);
        onReadyRef.current?.();
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        // Fall back to the system font stack so the UI stays usable.
        setFontsFailed(true);
        setFontsReady(true);
        onErrorRef.current?.(error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const statusMessage = fontsFailed
    ? 'Custom fonts could not be loaded; using the system font stack.'
    : fontsReady
      ? 'Open Sans is loaded at the document level for Shadow DOM usage.'
      : 'Loading widget fonts…';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <h1 className="text-xl font-semibold text-gray-900">{heading}</h1>
      <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
      <button
        type="button"
        className="mt-4 rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        onClick={() => onCta?.()}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
