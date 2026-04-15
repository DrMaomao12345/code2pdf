/**
 * index.js
 * Main API entry point. Can be used programmatically or via the CLI.
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

import { detectLanguage, highlight } from './highlighter.js'
import { resolveTheme } from './themeManager.js'
import { buildHtml } from './template.js'
import { generatePdf } from './pdfGenerator.js'

export { listThemes, BUILTIN_THEMES } from './themeManager.js'
export { getSupportedLanguages, detectLanguage } from './highlighter.js'
export { getPageSizes } from './pdfGenerator.js'

/**
 * Convert a source code file to PDF.
 *
 * @param {object} options
 * @param {string}   options.input         - Path to source file
 * @param {string}   options.output        - Path for output PDF
 * @param {string}   [options.language]    - Override language detection
 * @param {string}   [options.theme]       - Theme name or path to VSCode theme JSON
 * @param {number}   [options.fontSize]    - Font size in px (default 12)
 * @param {boolean}  [options.lineNumbers] - Show line numbers (default false)
 * @param {boolean}  [options.wrapLines]   - Wrap long lines (default true)
 * @param {boolean}  [options.indentGuides]- Draw vertical indent guide lines (default false)
 * @param {string}   [options.pageSize]    - Page size: a4, letter, a3... (default 'a4')
 * @param {boolean}  [options.landscape]   - Landscape orientation (default false)
 * @param {number}   [options.scale]       - Scale factor 0.1–2.0 (default 1.0)
 * @returns {Promise<void>}
 */
export async function convertToPdf(options) {
  const {
    input,
    output,
    language,
    theme = 'one-dark-pro',
    fontSize = 12,
    lineNumbers = false,
    wrapLines = true,
    indentGuides = false,
    pageSize = 'a4',
    landscape = false,
    scale = 1.0,
  } = options

  // Read source file
  if (!existsSync(input)) {
    throw new Error(`Input file not found: ${input}`)
  }
  const code = await readFile(input, 'utf-8')

  // Resolve language
  const lang = language || detectLanguage(input)

  // Resolve theme (built-in ID or custom VSCode JSON file path)
  const { themeId, customTheme } = await resolveTheme(theme)

  // Syntax highlight
  const { html: codeHtml, bg, fg } = await highlight(code, {
    lang,
    themeId,
    customTheme,
  })

  // Build HTML document
  const html = buildHtml({
    codeHtml,
    filename: path.resolve(input),
    language: lang,
    themeId,
    bg,
    fg,
    fontSize,
    lineNumbers,
    wrapLines,
    indentGuides,
    pageSize,
  })

  // Render to PDF
  await generatePdf({ html, outputPath: output, pageSize, landscape, scale })
}

/**
 * Convert raw code string to PDF (no file input needed).
 *
 * @param {object} options
 * @param {string}   options.code         - Source code string
 * @param {string}   options.output       - Output PDF path
 * @param {string}   options.language     - Language ID (required)
 * @param {string}   [options.filename]   - Display name in header
 * @param {string}   [options.theme]      - Theme name or VSCode JSON path
 * @param {number}   [options.fontSize]
 * @param {boolean}  [options.lineNumbers]
 * @param {boolean}  [options.wrapLines]
 * @param {boolean}  [options.indentGuides]
 * @param {string}   [options.pageSize]
 * @param {boolean}  [options.landscape]
 * @param {number}   [options.scale]
 * @returns {Promise<void>}
 */
export async function convertCodeToPdf(options) {
  const {
    code,
    output,
    language = 'text',
    filename = 'untitled',
    theme = 'one-dark-pro',
    fontSize = 12,
    lineNumbers = false,
    wrapLines = true,
    indentGuides = false,
    pageSize = 'a4',
    landscape = false,
    scale = 1.0,
  } = options

  const { themeId, customTheme } = await resolveTheme(theme)

  const { html: codeHtml, bg, fg } = await highlight(code, {
    lang: language,
    themeId,
    customTheme,
  })

  const html = buildHtml({
    codeHtml,
    filename,
    language,
    themeId,
    bg,
    fg,
    fontSize,
    lineNumbers,
    wrapLines,
    indentGuides,
    pageSize,
  })

  await generatePdf({ html, outputPath: output, pageSize, landscape, scale })
}
