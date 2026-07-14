import { useEffect, useRef, useState } from "react";

import { ensureFontFaces } from "../lib/font-loader-module";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export type EmbedWidgetComponentProps = {
  heading?: string;
  ctaLabel?: string;
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onCta?: () => void;
};

export function EmbedWidgetComponent({
  heading = "Embed Widget",
  ctaLabel = "Get Started",
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
    ? "Custom fonts could not be loaded; using the system font stack."
    : fontsReady
      ? "Open Sans is loaded at the document level for Shadow DOM usage."
      : "Loading widget fonts…";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mt-2 text-sm text-gray-600">{statusMessage}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onCta?.()}>{ctaLabel}</Button>
      </CardFooter>
    </Card>
  );
}
