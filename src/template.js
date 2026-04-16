/**
 * template.js
 * Generates the full HTML page used for PDF rendering.
 * The code block comes from shiki's codeToHtml output.
 */

import path from 'path'
import { BUILTIN_THEMES } from './themeManager.js'

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
    processedHtml = processedHtml.replace(
      /(<span class="line"[^>]*>)(<span[^>]*>)?([ \t]+)/g,
      (_m, lineOpen, tokenOpen = '', ws) => {
        const expanded = ws.replace(/\t/g, ' '.repeat(indentSize))
        const levels = Math.floor(expanded.length / indentSize)
        if (levels === 0) return _m
        let guides = ''
        for (let i = 0; i < levels; i++) {
          const left = igOffset === '0px'
            ? `${i * indentSize}ch`
            : `calc(${igOffset} + ${i * indentSize}ch)`
          guides += `<span class="indent-guide" style="left:${left}"></span>`
        }
        return lineOpen + guides + (tokenOpen || '') + ws
      }
    )
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: 14mm 12mm 16mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      background: ${bg};
      width: 100%;
    }

    body {
      font-family: 'Menlo', 'Monaco', 'Cascadia Code', 'Fira Code',
                   'JetBrains Mono', 'Consolas', 'Courier New', monospace;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: ${fg};
      background: ${bg};
    }

    /* ── File header bar ──────────────────────────────────── */
    .file-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: ${headerBg};
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

    /* ── Page footer with page numbers ───────────────────── */
    @page {
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
        font-size: 8px;
        color: ${lineNumColor};
        padding-top: 4mm;
      }
      @bottom-left {
        content: "${displayName}";
        font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
        font-size: 8px;
        color: ${lineNumColor};
        padding-top: 4mm;
      }
    }
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
}
