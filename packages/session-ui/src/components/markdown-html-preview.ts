const HTML_LANGUAGES = new Set(["html", "html5", "xhtml"])
export const HTML_PREVIEW_SANDBOX = "allow-scripts"

export function isHtmlPreviewLanguage(language: string | undefined) {
  return !!language && HTML_LANGUAGES.has(language.toLowerCase())
}

export function htmlPreviewDocument(source: string) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data: blob:; media-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'"></head><body>${source}</body></html>`
}
