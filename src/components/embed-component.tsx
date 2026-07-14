import { useEffect, useState } from 'react';

import { ensureFontFaces } from '../lib/font-loader-module';

export function EmbedWidgetComponent() {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    void ensureFontFaces(document).then(() => setFontsReady(true));
  }, []);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 font-sans shadow-lg">
      <h1 className="text-xl font-semibold text-gray-900">Embed Widget</h1>
      <p className="mt-2 text-sm text-gray-600">
        {fontsReady
          ? 'Open Sans is loaded at the document level for Shadow DOM usage.'
          : 'Loading widget fonts…'}
      </p>
      <button
        type="button"
        className="mt-4 rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        Get Started
      </button>
    </div>
  );
}
