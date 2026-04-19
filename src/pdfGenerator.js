/**
 * pdfGenerator.js
 * Converts an HTML string to a PDF file using Puppeteer (headless Chromium).
 */

import puppeteer from 'puppeteer'
import { PDFDocument, rgb } from 'pdf-lib'
import { readFile, writeFile } from 'fs/promises'

// Map user-facing page size names to Puppeteer format values
const PAGE_SIZES = {
  a4: 'A4',
  letter: 'Letter',
  legal: 'Legal',
  a3: 'A3',
  a5: 'A5',
  tabloid: 'Tabloid',
}

// Paper dimensions in pixels at 96 DPI (px/mm = 96/25.4).
// Setting the viewport to exactly match the paper ensures CSS layout
// (especially @page margin calculations) uses the correct width.
const PX_PER_MM = 96 / 25.4
const PAPER_PX = {
  a4:      { w: Math.round(210   * PX_PER_MM), h: Math.round(297   * PX_PER_MM) },
  letter:  { w: Math.round(215.9 * PX_PER_MM), h: Math.round(279.4 * PX_PER_MM) },
  legal:   { w: Math.round(215.9 * PX_PER_MM), h: Math.round(355.6 * PX_PER_MM) },
  a3:      { w: Math.round(297   * PX_PER_MM), h: Math.round(420   * PX_PER_MM) },
  a5:      { w: Math.round(148   * PX_PER_MM), h: Math.round(210   * PX_PER_MM) },
  tabloid: { w: Math.round(279.4 * PX_PER_MM), h: Math.round(431.8 * PX_PER_MM) },
}

/**
 * Render HTML to a PDF file.
 *
 * @param {object} params
 * @param {string}  params.html         - Full HTML document string
 * @param {string}  params.outputPath   - Output PDF file path
 * @param {string}  params.pageSize     - Page size (a4, letter, etc.)
 * @param {boolean} params.landscape    - Landscape orientation
 * @param {number}  params.scale        - Content scale factor (0.5–2.0)
 */
export async function generatePdf({
  html,
  headerHtml = '',
  footerHtml = '',
  outputPath,
  pageSize = 'a4',
  landscape = false,
  scale = 1.0,
  marginH = 12,
  marginV = 12,
  fullPageBg = false,
  bg = null,
}) {
  const format = PAGE_SIZES[pageSize.toLowerCase()] || 'A4'

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
  })

  try {
    const page = await browser.newPage()

    // Match the viewport to the paper size so CSS layout uses the correct
    // width (prevents content overflow when @page{margin:0} is used).
    const dims = PAPER_PX[pageSize.toLowerCase()] || PAPER_PX.a4
    const vw = landscape ? dims.h : dims.w
    const vh = landscape ? dims.w : dims.h
    await page.setViewport({ width: vw, height: vh, deviceScaleFactor: 1 })

    // Set content and wait for any web fonts / layout
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF with print CSS media
    await page.emulateMediaType('print')

    // Puppeteer's displayHeaderFooter is the only reliable way to render page
    // numbers — CSS counter(page) in regular elements and @page margin boxes
    // are both unsupported/broken in the Chromium version bundled with Puppeteer.
    const pTop    = `${marginV + 2}mm`
    const pRight  = `${marginH}mm`
    const pBottom = `${marginV + 4}mm`
    const pLeft   = `${marginH}mm`

    await page.pdf({
      path: outputPath,
      format,
      landscape,
      scale: Math.min(2.0, Math.max(0.1, scale)),
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: headerHtml || '<div></div>',
      footerTemplate: footerHtml || '<div></div>',
      margin: { top: pTop, right: pRight, bottom: pBottom, left: pLeft },
      preferCSSPageSize: false,
    })
  } finally {
    await browser.close()
  }

  // Post-process: add full-bleed background behind every page using pdf-lib.
  // This is done AFTER Puppeteer so the HTML/CSS layout is identical whether
  // fullPageBg is on or off — we never touch @page margins or body padding.
  if (fullPageBg && bg) {
    // Parse bg color into 0-1 r/g/b values.
    // shiki may return: "#rrggbb", "#rgb", "rgb(r,g,b)", "rgba(r,g,b,a)"
    let r, g, b
    const rgbMatch = bg.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
    if (rgbMatch) {
      r = parseInt(rgbMatch[1]) / 255
      g = parseInt(rgbMatch[2]) / 255
      b = parseInt(rgbMatch[3]) / 255
    } else {
      let hex = bg.replace('#', '')
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
      r = parseInt(hex.slice(0, 2), 16) / 255
      g = parseInt(hex.slice(2, 4), 16) / 255
      b = parseInt(hex.slice(4, 6), 16) / 255
    }

    const origBytes = await readFile(outputPath)
    const origPdf   = await PDFDocument.load(origBytes)
    const newPdf    = await PDFDocument.create()

    for (const page of origPdf.getPages()) {
      const { width, height } = page.getSize()
      const [emb] = await newPdf.embedPages([page])
      const np = newPdf.addPage([width, height])
      // Draw background first (behind everything)
      np.drawRectangle({ x: 0, y: 0, width, height, color: rgb(r, g, b) })
      // Draw original page content on top
      np.drawPage(emb)
    }

    await writeFile(outputPath, await newPdf.save())
  }
}

/**
 * List valid page size options.
 */
export function getPageSizes() {
  return Object.keys(PAGE_SIZES)
}
