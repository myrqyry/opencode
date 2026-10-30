import { describe, expect, test } from "bun:test"
import { HTML_PREVIEW_SANDBOX, htmlPreviewDocument, isHtmlPreviewLanguage } from "./markdown-html-preview"

describe("HTML markdown previews", () => {
  test("recognizes HTML fence language names without matching other languages", () => {
    expect(isHtmlPreviewLanguage("html")).toBe(true)
    expect(isHtmlPreviewLanguage("HTML5")).toBe(true)
    expect(isHtmlPreviewLanguage("xhtml")).toBe(true)
    expect(isHtmlPreviewLanguage("javascript")).toBe(false)
    expect(isHtmlPreviewLanguage(undefined)).toBe(false)
  })

  test("creates a self-contained preview document with network access disabled", () => {
    const document = htmlPreviewDocument('<h1>Example</h1><script>document.body.dataset.ready = "true"</script>')
    expect(document).toContain("<h1>Example</h1>")
    expect(document).toContain("script-src 'unsafe-inline'")
    expect(document).toContain("connect-src 'none'")
    expect(document).toContain("form-action 'none'")
    expect(document).toContain("object-src 'none'")
    expect(HTML_PREVIEW_SANDBOX).toBe("allow-scripts")
    expect(HTML_PREVIEW_SANDBOX).not.toContain("allow-same-origin")
  })
})
