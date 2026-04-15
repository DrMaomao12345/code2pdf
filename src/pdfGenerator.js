/**
 * pdfGenerator.js
 * Converts an HTML string to a PDF file using Puppeteer (headless Chromium).
 */

import puppeteer from 'puppeteer'

// Map user-facing page size names to Puppeteer format values
const PAGE_SIZES = {
  a4: 'A4',
  letter: 'Letter',
  legal: 'Legal',
  a3: 'A3',
  a5: 'A5',
  tabloid: 'Tabloid',
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
  outputPath,
  pageSize = 'a4',
  landscape = false,
  scale = 1.0,
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

    // Set content and wait for any web fonts / layout
    await page.setContent(html, { waitUntil: 'networkidle0' })

    // Generate PDF with print CSS media
    await page.emulateMediaType('print')

    await page.pdf({
      path: outputPath,
      format,
      landscape,
      scale: Math.min(2.0, Math.max(0.1, scale)),
      printBackground: true,   // Required to render background colors
      displayHeaderFooter: false,
      preferCSSPageSize: false,
    })
  } finally {
    await browser.close()
  }
}

/**
 * List valid page size options.
 */
export function getPageSizes() {
  return Object.keys(PAGE_SIZES)
}
