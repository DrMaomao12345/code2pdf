/**
 * server.js
 * Local web UI server for code2pdf.
 * Run with: npm run ui
 */

import express from 'express'
import path from 'path'
import os from 'os'
import { createReadStream, unlinkSync } from 'fs'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

import { highlight, detectLanguage, getSupportedLanguages } from './highlighter.js'
import { resolveTheme, BUILTIN_THEMES } from './themeManager.js'
import { buildHtml } from './template.js'
import { generatePdf } from './pdfGenerator.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(express.json({ limit: '16mb' }))
app.use(express.static(path.join(__dirname, '..', 'ui')))

// ── API routes ─────────────────────────────────────────────────────────────

/** List all built-in themes */
app.get('/api/themes', (_req, res) => {
  res.json(BUILTIN_THEMES)
})

/** List all supported language IDs */
app.get('/api/languages', (_req, res) => {
  res.json(getSupportedLanguages())
})

/** Detect language from filename */
app.get('/api/detect', (req, res) => {
  const lang = detectLanguage(req.query.filename || '')
  res.json({ lang })
})

/**
 * Highlight code and return shiki HTML for preview.
 * Accepts optional customThemeJson for VSCode theme JSON files.
 * Truncates to first 120 lines for fast preview rendering.
 */
app.post('/api/preview', async (req, res) => {
  try {
    const { code = '', lang = 'text', theme = 'one-dark-pro', customThemeJson = null } = req.body

    const preview = code.split('\n').slice(0, 120).join('\n')

    const { themeId, customTheme } = customThemeJson
      ? { themeId: customThemeJson.name || 'custom', customTheme: customThemeJson }
      : await resolveTheme(theme)

    const { html, bg, fg } = await highlight(preview, { lang, themeId, customTheme })
    res.json({ html, bg, fg })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

/**
 * Generate PDF and stream it for inline preview (no download headers).
 */
app.post('/api/preview-pdf', async (req, res) => {
  const tmpPath = path.join(os.tmpdir(), `code2pdf-preview-${Date.now()}.pdf`)
  const cleanup = () => { try { unlinkSync(tmpPath) } catch {} }
  try {
    const {
      code = '', filename = 'code.txt', lang = 'text',
      theme = 'one-dark-pro', customThemeJson = null,
      fontSize = 12, lineHeight = 1.6, indentSize = 2,
      lineNumbers = false, wrapLines = true, indentGuides = false,
      pageSize = 'a4', landscape = false, scale = 1.0,
      marginH = 12, marginV = 12, fullPageBg = false,
    } = req.body

    const { themeId, customTheme } = customThemeJson
      ? { themeId: customThemeJson.name || 'custom', customTheme: customThemeJson }
      : await resolveTheme(theme)

    const { html: codeHtml, bg, fg } = await highlight(code, { lang, themeId, customTheme })
    const { html, headerHtml, footerHtml } = buildHtml({
      codeHtml, filename, language: lang, themeId,
      bg, fg, fontSize, lineHeight, indentSize,
      lineNumbers, wrapLines, indentGuides, pageSize, landscape,
      marginH, marginV, fullPageBg,
    })

    await generatePdf({ html, headerHtml, footerHtml, outputPath: tmpPath, pageSize, landscape, scale, marginH, marginV, fullPageBg, bg })

    res.setHeader('Content-Type', 'application/pdf')
    const stream = createReadStream(tmpPath)
    stream.pipe(res)
    stream.on('end', cleanup)
    stream.on('error', cleanup)
  } catch (err) {
    cleanup()
    res.status(500).json({ error: err.message })
  }
})

/**
 * Generate PDF and stream it back to the browser for download.
 */
app.post('/api/export', async (req, res) => {
  const tmpPath = path.join(os.tmpdir(), `code2pdf-${Date.now()}.pdf`)
  const cleanup = () => { try { unlinkSync(tmpPath) } catch {} }

  try {
    const {
      code = '', filename = 'code.txt', lang = 'text',
      theme = 'one-dark-pro', customThemeJson = null,
      fontSize = 12, lineHeight = 1.6, indentSize = 2,
      lineNumbers = false, wrapLines = true, indentGuides = false,
      pageSize = 'a4', landscape = false, scale = 1.0,
      marginH = 12, marginV = 12, fullPageBg = false,
    } = req.body

    const { themeId, customTheme } = customThemeJson
      ? { themeId: customThemeJson.name || 'custom', customTheme: customThemeJson }
      : await resolveTheme(theme)

    const { html: codeHtml, bg, fg } = await highlight(code, { lang, themeId, customTheme })
    const { html, headerHtml, footerHtml } = buildHtml({
      codeHtml, filename, language: lang, themeId,
      bg, fg, fontSize, lineHeight, indentSize,
      lineNumbers, wrapLines, indentGuides, pageSize, landscape,
      marginH, marginV, fullPageBg,
    })

    await generatePdf({ html, headerHtml, footerHtml, outputPath: tmpPath, pageSize, landscape, scale, marginH, marginV, fullPageBg, bg })

    const baseName = path.basename(filename, path.extname(filename))
    // RFC 5987: handles non-ASCII filenames (Chinese, emoji, etc.)
    const encoded = encodeURIComponent(baseName + '.pdf')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="download.pdf"; filename*=UTF-8''${encoded}`)

    const stream = createReadStream(tmpPath)
    stream.pipe(res)
    stream.on('end', cleanup)
    stream.on('error', cleanup)
  } catch (err) {
    cleanup()
    res.status(500).json({ error: err.message })
  }
})

// ── Start ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3131', 10)

app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`
  console.log(`\n  ◈ code2pdf  →  \x1b[36m\x1b[4m${url}\x1b[0m\n`)

  const opener = process.platform === 'win32' ? 'start'
    : process.platform === 'darwin' ? 'open'
    : 'xdg-open'
  exec(`${opener} ${url}`)
})
