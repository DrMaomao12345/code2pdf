/**
 * template.js
 * Generates the full HTML page used for PDF rendering.
 * The code block comes from shiki's codeToHtml output.
 */

import path from 'path'
import { BUILTIN_THEMES } from './themeManager.js'

// Paper dimensions in mm (portrait). Used to set a reliable min-height for
// full-page background fill rather than relying on 100vh in print mode.
const PAGE_HEIGHTS_MM = { a4: 297, letter: 279.4, legal: 355.6, a3: 420, a5: 210, tabloid: 431.8 }
const PAGE_WIDTHS_MM  = { a4: 210, letter: 215.9, legal: 215.9, a3: 297, a5: 148, tabloid: 279.4 }

/**
 * Normalize a hex color to 6-digit form (e.g. "#fff" -> "#ffffff").
 */
function normalizeHex(hex) {
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  return '#' + h
}

/**
 * Slightly darken or lighten a hex color for UI accents.
 */
function adjustColor(hex, amount) {
  const num = parseInt(normalizeHex(hex).replace('#', ''), 16)
  const r = Math.min(255, Math.max(0, (num >> 16) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Check if a hex color is "dark" (for contrast decisions).
 */
function isDark(hex) {
  const num = parseInt(normalizeHex(hex).replace('#', ''), 16)
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
}

/**
 * Build the full HTML document for PDF rendering.
 *
 * @param {object} params
 * @param {string} params.codeHtml       - HTML from shiki's codeToHtml
 * @param {string} params.filename       - Source file name (for header)
 * @param {string} params.language       - Language display name
 * @param {string} params.themeId        - Theme ID (for display)
 * @param {string} params.bg             - Background color from theme
 * @param {string} params.fg             - Foreground color from theme
 * @param {number} params.fontSize       - Font size in px
 * @param {boolean} params.lineNumbers   - Show line numbers
 * @param {boolean} params.wrapLines     - Wrap long lines
 * @param {string} params.pageSize       - PDF page size (A4, Letter, etc.)
 * @returns {string} Full HTML document
 */
/**
 * Build the Puppeteer displayHeaderFooter header template string.
 * In fullPageBg mode this fills the reserved top-margin area with the theme
 * background color on EVERY page (the only reliable way to do this, since
 * @page margin areas are NOT painted by html/body backgrounds in Chromium).
 * IMPORTANT: No <style> tags — they corrupt the main page rendering.
 */
export function buildHeaderTemplate({ bg = null, fullPageBg = false, marginV = 12 }) {
  // In fullPageBg mode @page margin-top = 0, so no header template area exists.
  // Always return an empty placeholder.
  return '<div></div>'
}

/**
 * Build the Puppeteer displayHeaderFooter footer template string.
 * Uses Puppeteer's special <span class="pageNumber"> / <span class="totalPages">
 * placeholders which are the ONLY reliable way to get page numbers in Puppeteer.
 */
export function buildFooterTemplate({ displayName, lineNumColor, marginH, marginV = 12, bg = null, fullPageBg = false }) {
  // The footer template is rendered inside a Puppeteer-managed iframe.
  // IMPORTANT: Do NOT add a <style> tag or position:fixed — both corrupt the
  // main page rendering and make all content invisible. Use inline styles only.
  //
  // In fullPageBg mode, the main page's .page-bg div (position:fixed; bottom:-Xmm)
  // extends into the footer margin area and provides the theme background color
  // for the ENTIRE footer — including the bottom ~5mm that the footer template
  // iframe can never paint (Chromium limitation). No background is needed here.
  return `<div style="width:100%;font-family:Menlo,Monaco,Consolas,'Courier New',monospace;font-size:9px;color:${lineNumColor};padding:0 ${marginH}mm;box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%;">${displayName}</span><span style="white-space:nowrap;flex-shrink:0;"><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`
}

export function buildHtml({
  codeHtml,
  filename,
  language,
  themeId,
  bg,
  fg,
  fontSize = 12,
  lineHeight = 1.6,
  indentSize = 2,
  lineNumbers = false,
  wrapLines = true,
  indentGuides = false,
  pageSize = 'A4',
  landscape = false,
  marginH = 12,
  marginV = 12,
  fullPageBg = false,
}) {
  const dark = isDark(bg)
  const headerBg = dark ? adjustColor(bg, 15) : adjustColor(bg, -15)
  const borderColor = dark ? adjustColor(bg, 30) : adjustColor(bg, -30)
  const lineNumColor = dark ? adjustColor(bg, 80) : adjustColor(bg, -80)
  const lineNumBorderColor = dark ? adjustColor(bg, 50) : adjustColor(bg, -50)
  const indentGuideColor = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'
  // lineHeight and indentSize are passed in as parameters
  const lineNumWidth = 44
  const lineNumPadL  = lineNumWidth + 10   // gap between gutter border and code

  // Theme display label
  const themeLabel = BUILTIN_THEMES[themeId]?.label || themeId

  // Language pill — theme-aware, always legible (uses theme's fg)
  const pillBg     = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const pillBorder = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'
  const dotColor   = dark ? '#4a9eff' : '#3b82f6'

  const displayName = filename ? path.basename(filename) : 'untitled'

  // Modify shiki output:
  // 1. Remove the background-color from <pre> since we handle it globally
  // 2. Ensure the pre has our class
  let processedHtml = codeHtml
    .replace(/<pre class="shiki/, '<pre class="shiki code-block')
    .replace(/style="([^"]*)"/, (_, styles) => {
      // Keep only color-related styles, remove background-color
      const filtered = styles
        .split(';')
        .filter(s => !s.trim().startsWith('background-color'))
        .join(';')
      return `style="${filtered}"`
    })

  // Strip whitespace (newlines) between .line spans — inside <pre> they'd be
  // rendered as visible line breaks, creating gaps between lines.
  // This must be unconditional: shiki always emits newlines between .line spans,
  // and with white-space: pre-wrap they render as visible ~19px gaps.
  processedHtml = processedHtml.replace(/<\/span>\s+<span class="line"/g, '</span><span class="line"')

  // When indentGuides is on, inject absolutely-positioned <span class="indent-guide">
  // elements for each indent level. Because they use position:absolute + top:0 + bottom:0,
  // each guide fills the FULL height of its .line parent. Since .line blocks stack with
  // no gap, consecutive lines' guides form one perfectly continuous vertical rule.
  const igOffset = lineNumbers ? `${lineNumPadL}px` : '0px'
  if (indentGuides) {
    const makeGuides = (level) => {
      let g = ''
      for (let i = 0; i < level; i++) {
        const left = igOffset === '0px'
          ? `${i * indentSize}ch`
          : `calc(${igOffset} + ${i * indentSize}ch)`
        g += `<span class="indent-guide" style="left:${left}"></span>`
      }
      return g
    }

    let prevLevel = 0

    // Split at each line-span so we can process blank lines with context
    const parts = processedHtml.split(/(?=<span class="line)/)
    processedHtml = parts.map(part => {
      if (!part.startsWith('<span class="line')) return part

      const firstGt   = part.indexOf('>')
      const lastClose = part.lastIndexOf('</span>')
      if (firstGt === -1 || lastClose === -1) return part

      const open    = part.slice(0, firstGt + 1)
      const content = part.slice(firstGt + 1, lastClose)
      const after   = part.slice(lastClose)

      // Strip tags to get raw text and check leading whitespace
      const raw      = content.replace(/<[^>]+>/g, '')
      const wsMatch  = raw.match(/^([ \t]+)/)

      if (wsMatch) {
        const expanded = wsMatch[1].replace(/\t/g, ' '.repeat(indentSize))
        const level    = Math.floor(expanded.length / indentSize)
        if (level > 0) {
          prevLevel = level
          return open + makeGuides(level) + content + after
        }
        prevLevel = 0
        return part
      }

      // Blank line — carry guides from previous indented line
      if (!raw.trim() && prevLevel > 0) {
        return open + makeGuides(prevLevel) + content + after
      }

      // Non-indented, non-blank line
      prevLevel = 0
      return part
    }).join('')
  }

  // When fullPageBg: use @page margin:0 + body padding so body background
  // fills the entire page (Chromium ignores @page{background} and html/body
  // backgrounds only paint the content box, not the margin area).
  // Page numbers are rendered via Puppeteer displayHeaderFooter instead of @page margin boxes.
  const pTop    = marginV + 2
  const pRight  = marginH
  const pBottom = marginV + 4
  const pLeft   = marginH

  // Compute the physical page height in mm so we can use it as a reliable
  // min-height (100vh is not reliable in Chromium print mode when setViewport
  // is used — the two coordinate systems don't always agree).
  const pageSizeKey = pageSize.toLowerCase()
  const rawH = landscape
    ? (PAGE_WIDTHS_MM[pageSizeKey]  || 210)
    : (PAGE_HEIGHTS_MM[pageSizeKey] || 297)
  const rawW = landscape
    ? (PAGE_HEIGHTS_MM[pageSizeKey] || 297)
    : (PAGE_WIDTHS_MM[pageSizeKey]  || 210)
  // In fullPageBg mode (@page margin:0) the body fills the whole page,
  // so min-height equals the full page height.
  // In normal mode (@page margin set) we don't need to force height.
  const pageHeightMm = rawH

  const headerHtml = buildHeaderTemplate({ bg, fullPageBg, marginV })
  const footerHtml = buildFooterTemplate({ displayName, lineNumColor, marginH, marginV, bg, fullPageBg })

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName}</title>
  <style>
    @page {
      size: ${pageSize} ${landscape ? 'landscape' : 'portrait'};
      margin: ${pTop}mm ${pRight}mm ${pBottom}mm ${pLeft}mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      background: ${bg};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Fira Code',
                   'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: ${fg};
      background: ${bg};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── File header bar ──────────────────────────────────── */
    .file-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: transparent;
      border-bottom: 1px solid ${borderColor};
      font-size: ${Math.max(fontSize - 1, 9)}px;
    }

    .file-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: ${dotColor};
      opacity: 0.85;
      flex-shrink: 0;
    }

    .file-name {
      font-weight: 600;
      color: ${fg};
      letter-spacing: 0.01em;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-lang {
      background: ${pillBg};
      color: ${fg};
      border: 1px solid ${pillBorder};
      padding: 1px 7px;
      border-radius: 3px;
      font-size: ${Math.max(fontSize - 2, 8)}px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      flex-shrink: 0;
      opacity: 0.85;
    }

    .file-theme {
      color: ${lineNumColor};
      font-size: ${Math.max(fontSize - 2, 8)}px;
      flex-shrink: 0;
      opacity: 0.7;
    }

    /* ── Code block (shiki output overrides) ──────────────── */
    pre.code-block {
      background: ${bg} !important;
      margin: 0 !important;
      padding: ${lineNumbers ? '14px 14px 14px 0' : '14px'} !important;
      overflow: visible !important;
      max-width: 100%;
      white-space: ${wrapLines ? 'pre-wrap' : 'pre'} !important;
      word-break: ${wrapLines ? 'break-all' : 'normal'} !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      tab-size: ${indentSize};
    }

    pre.code-block code {
      font-family: inherit !important;
      font-size: inherit !important;
      ${lineNumbers ? 'counter-reset: line-number;' : ''}
      display: block;
    }

    /* Each line from shiki is wrapped in <span class="line"> */
    .line {
      display: block;
      min-height: ${lineHeight}em;
      break-inside: avoid;
      ${lineNumbers ? 'padding-left: ' + lineNumPadL + 'px;' : 'padding-left: 0;'}
      position: relative;
    }

    /* Indent guides — absolutely positioned, fixed height = one line.
       For non-wrapped lines the guide fills the full .line height so
       consecutive guides form one continuous vertical rule.
       For wrapped lines the guide only covers the first visual line,
       avoiding the guide cutting through wrapped text. */
    .indent-guide {
      position: absolute;
      top: 0;
      height: ${lineHeight}em;
      width: 0;
      border-left: 1px solid ${indentGuideColor};
      box-sizing: content-box;
      pointer-events: none;
      user-select: none;
    }

    /* Line numbers via CSS counter — ::before stretched to full .line height
       so the right separator border is continuous from top to bottom. */
    ${lineNumbers ? `
    .line::before {
      counter-increment: line-number;
      content: counter(line-number);
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: ${lineNumWidth}px;
      padding: 0 10px 0 0;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      box-sizing: border-box;
      color: ${lineNumColor};
      border-right: 1px solid ${lineNumBorderColor};
      user-select: none;
      pointer-events: none;
      font-size: 0.85em;
      line-height: 1;
      font-family: inherit;
    }` : ''}

  </style>
</head>
<body>
  <div class="file-header">
    <div class="file-dot"></div>
    <span class="file-name">${displayName}</span>
    ${language ? `<span class="file-lang">${language}</span>` : ''}
    <span class="file-theme">${themeLabel}</span>
  </div>
  ${processedHtml}
</body>
</html>`

  return { html, headerHtml, footerHtml }
}
