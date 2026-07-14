import openSansSemiBoldWoff2 from "../../assets/fonts/open-sans-v44-latin-600.woff2";
import openSansRegularWoff2 from "../../assets/fonts/open-sans-v44-latin-regular.woff2";

const FONT_DEFINITIONS = [
  {
    key: "open-sans-400",
    family: "Open Sans",
    source: openSansRegularWoff2,
    weight: "400",
  },
  {
    key: "open-sans-600",
    family: "Open Sans",
    source: openSansSemiBoldWoff2,
    weight: "600",
  },
] as const;

const fontRegistrations = new WeakMap<Document, Promise<void>>();
const registeredFonts = new WeakMap<Document, Set<string>>();

/**
 * Registers widget fonts at the document level so Shadow DOM consumers can use
 * them without relying on shadow-scoped @font-face rules.
 */
export function ensureFontFaces(root: Document | ShadowRoot) {
  const targetDocument = root instanceof Document ? root : root.ownerDocument;
  const existingRegistration = fontRegistrations.get(targetDocument);

  if (existingRegistration) {
    return existingRegistration;
  }

  const registration = registerFontFaces(targetDocument).catch((error) => {
    fontRegistrations.delete(targetDocument);
    throw error;
  });

  fontRegistrations.set(targetDocument, registration);

  return registration;
}

async function registerFontFaces(targetDocument: Document) {
  if (typeof FontFace === "undefined" || !("fonts" in targetDocument)) {
    return;
  }

  const fontFaceSet = targetDocument.fonts;
  const loadedFontKeys = registeredFonts.get(targetDocument) ?? new Set<string>();
  const pendingFonts = FONT_DEFINITIONS.filter(({ key }) => !loadedFontKeys.has(key));

  if (pendingFonts.length === 0) {
    return;
  }

  const loadedFonts = await Promise.all(
    pendingFonts.map(({ family, key, source, weight }) => {
      const fontFace = new FontFace(family, `url(${source}) format('woff2')`, {
        display: "swap",
        style: "normal",
        weight,
      });

      return fontFace.load().then((loadedFont) => ({ key, loadedFont }));
    }),
  );

  for (const { key, loadedFont } of loadedFonts) {
    fontFaceSet.add(loadedFont);
    loadedFontKeys.add(key);
  }

  registeredFonts.set(targetDocument, loadedFontKeys);
}
