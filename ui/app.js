/**
 * app.js — code2pdf UI frontend
 */

// ── Theme bg swatches ─────────────────────────────────────────
const THEME_BG = {
  'one-dark-pro': '#282c34', 'github-dark': '#0d1117', 'github-dark-default': '#0d1117',
  'github-dark-dimmed': '#22272e', 'github-dark-high-contrast': '#0a0c10',
  'dracula': '#282a36', 'dracula-soft': '#282a36', 'tokyo-night': '#1a1b26',
  'night-owl': '#011627', 'monokai': '#272822', 'nord': '#2e3440',
  'dark-plus': '#1e1e1e', 'material-theme': '#263238', 'material-theme-darker': '#212121',
  'material-theme-ocean': '#0f111a', 'material-theme-palenight': '#292d3e',
  'catppuccin-mocha': '#1e1e2e', 'catppuccin-macchiato': '#24273a',
  'catppuccin-frappe': '#303446', 'rose-pine': '#191724', 'rose-pine-moon': '#232136',
  'synthwave-84': '#2b213a', 'ayu-dark': '#0d1017', 'poimandres': '#1b1e28',
  'houston': '#17191e', 'vitesse-dark': '#121212', 'vitesse-black': '#000000',
  'slack-dark': '#1a1d21', 'solarized-dark': '#002b36', 'everforest-dark': '#2d353b',
  'andromeeda': '#23262e', 'aurora-x': '#07090f', 'laserwave': '#27212e',
  'plastic': '#21252b', 'vesper': '#101010', 'red': '#390000', 'min-dark': '#1f1f1f',
  'github-light': '#ffffff', 'github-light-default': '#ffffff',
  'github-light-high-contrast': '#ffffff', 'one-light': '#fafafa',
  'catppuccin-latte': '#eff1f5', 'rose-pine-dawn': '#faf4ed',
  'material-theme-lighter': '#fafafa', 'vitesse-light': '#f9f9f9',
  'solarized-light': '#fdf6e3', 'everforest-light': '#f2efdf',
  'snazzy-light': '#f6f6f6', 'slack-ochin': '#ffffff', 'min-light': '#f9f9f9',
}

// Moon / Sun SVG icons
const ICON_MOON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_SUN  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`

// ── State ─────────────────────────────────────────────────────
const state = {
  code: null, filename: null, lang: null, lineCount: 0,
  selectedTheme: 'one-dark-pro',
  customThemeJson: null, customThemeLabel: null,
  themes: {},
  fontSize: 12, lineHeight: 1.6, indentSize: 2,
  lineNumbers: false, wrapLines: true, indentGuides: false,
  pageSize: 'a4', landscape: false, scale: 1.0,
  previewBg: '#282c34',
  previewDebounce: null,
  exporting: false,
  uiMode: 'light',
}

// ── DOM refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id)
const dropzone      = $('dropzone')
const fileInput     = $('file-input')
const fileBadge     = $('file-badge')
const fileNameDisp  = $('file-name-display')
const fileClear     = $('file-clear')
const langRow       = $('lang-row')
const langOverride  = $('lang-override')
const langList      = $('lang-list')
const themeSearch   = $('theme-search')
const themeList     = $('theme-list')
const customInput   = $('custom-theme-input')
const fontSizeRange = $('font-size')
const fontSizeVal   = $('font-size-val')
const lineHeightRange = $('line-height')
const lineHeightVal = $('line-height-val')
const lineNumbers   = $('line-numbers')
const wrapLines     = $('wrap-lines')
const indentGuides  = $('indent-guides')
const scaleRange    = $('scale')
const scaleVal      = $('scale-val')
const exportBtn     = $('export-btn')
const exportLabel   = $('export-label')
const uiModeBtn     = $('ui-mode-btn')
const previewPanel  = $('preview-panel')
const previewBar    = $('preview-bar')
const previewEmpty  = $('preview-empty')
const previewLoad   = $('preview-loading')
const previewCode   = $('preview-code')
const prevFilename  = $('preview-filename')
const prevLangLabel = $('preview-lang-label')
const prevLines     = $('preview-lines')
const prevTheme     = $('preview-theme-label')

// ── Init ──────────────────────────────────────────────────────
async function init() {
  uiModeBtn.innerHTML = ICON_SUN

  // Load themes
  try {
    const res = await fetch('/api/themes')
    state.themes = await res.json()
  } catch {
    toast('error', '无法连接到服务器')
    return
  }

  // Load languages into datalist
  try {
    const res = await fetch('/api/languages')
    const langs = await res.json()
    langs.forEach(l => {
      const opt = document.createElement('option')
      opt.value = l
      langList.appendChild(opt)
    })
  } catch { /* non-fatal */ }

  renderThemeList()
  bindEvents()
}

// ── Render theme list ─────────────────────────────────────────
function renderThemeList(filter = '') {
  const q = filter.toLowerCase().trim()
  const match = ([id, { label }]) => !q || id.includes(q) || label.toLowerCase().includes(q)
  const all = Object.entries(state.themes)
  const dark  = all.filter(([id, v]) => v.type === 'dark'  && match([id, v]))
  const light = all.filter(([id, v]) => v.type === 'light' && match([id, v]))

  let html = ''
  if (dark.length)  html += `<div class="theme-group">深色</div>` + dark.map(([id, { label }]) => themeItemHtml(id, label)).join('')
  if (light.length) html += `<div class="theme-group">浅色</div>` + light.map(([id, { label }]) => themeItemHtml(id, label)).join('')

  if (state.customThemeLabel) {
    const id = '__custom__', isSel = state.selectedTheme === id
    html += `<div class="theme-group">自定义</div><div class="theme-item ${isSel ? 'selected' : ''}" data-id="${id}"><span class="theme-swatch" style="background:${state.previewBg}"></span><span class="theme-name">${state.customThemeLabel}</span>${isSel ? '<span class="theme-check">✓</span>' : ''}</div>`
  }
  if (!html) html = `<div style="color:var(--text-3);font-size:12px;padding:12px 4px;">无匹配主题</div>`

  themeList.innerHTML = html
  themeList.querySelectorAll('.theme-item').forEach(el => el.addEventListener('click', () => selectTheme(el.dataset.id)))
  themeList.querySelector('.theme-item.selected')?.scrollIntoView({ block: 'nearest' })
}

function themeItemHtml(id, label) {
  const bg = THEME_BG[id] || '#1e1e1e'
  const sel = state.selectedTheme === id
  return `<div class="theme-item ${sel ? 'selected' : ''}" data-id="${id}"><span class="theme-swatch" style="background:${bg}"></span><span class="theme-name">${label}</span>${sel ? '<span class="theme-check">✓</span>' : ''}</div>`
}

// ── Segmented controls ────────────────────────────────────────
function initSegGroup(groupId, onChange) {
  const group = $(groupId)
  group.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      onChange(btn.dataset.value)
    })
  })
}

// ── Theme selection ───────────────────────────────────────────
function selectTheme(id) {
  state.selectedTheme = id
  renderThemeList(themeSearch.value)
  schedulePreview()
}

// ── File load ─────────────────────────────────────────────────
function loadFile(file) {
  if (!file) return
  state.filename = file.name

  const reader = new FileReader()
  reader.onload = async e => {
    state.code = e.target.result
    state.lineCount = state.code.split('\n').length

    try {
      const r = await fetch(`/api/detect?filename=${encodeURIComponent(file.name)}`)
      const { lang } = await r.json()
      state.lang = lang
    } catch { state.lang = 'text' }

    // Update file section
    fileNameDisp.textContent = file.name
    fileBadge.classList.add('visible')
    dropzone.style.display = 'none'
    langOverride.value = state.lang
    langRow.classList.add('visible')
    exportBtn.disabled = false

    // Update preview bar
    prevFilename.textContent = file.name
    prevLangLabel.textContent = state.lang
    prevLines.textContent = `${state.lineCount.toLocaleString()} 行`
    previewBar.classList.add('visible')
    previewEmpty.classList.add('hidden')

    schedulePreview(0)
  }
  reader.readAsText(file)
}

function clearFile() {
  state.code = null; state.filename = null; state.lang = null
  fileBadge.classList.remove('visible')
  langRow.classList.remove('visible')
  langOverride.value = ''
  dropzone.style.display = ''
  exportBtn.disabled = true
  previewBar.classList.remove('visible')
  previewEmpty.classList.remove('hidden')
  previewCode.innerHTML = ''
  previewPanel.style.background = ''
}

// ── Preview: re-highlight (server call) ───────────────────────
function schedulePreview(delay = 280) {
  clearTimeout(state.previewDebounce)
  state.previewDebounce = setTimeout(fetchPreview, delay)
}

async function fetchPreview() {
  if (!state.code) return
  previewLoad.classList.add('visible')
  try {
    const isCustom = state.selectedTheme === '__custom__'
    const body = {
      code: state.code,
      lang: state.lang || 'text',
      theme: isCustom ? (state.customThemeJson?.name || 'custom') : state.selectedTheme,
      customThemeJson: isCustom ? state.customThemeJson : null,
    }
    const res = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error((await res.json()).error)
    const { html, bg } = await res.json()
    state.previewBg = bg

    previewCode.innerHTML = html
    if (state.lineCount > 120) {
      const note = document.createElement('div')
      note.className = 'preview-truncated'
      note.textContent = `预览显示前 120 行，完整 ${state.lineCount.toLocaleString()} 行将包含在 PDF 中`
      previewCode.appendChild(note)
    }

    previewPanel.style.background = bg
    prevTheme.textContent = state.selectedTheme === '__custom__'
      ? (state.customThemeLabel || 'Custom')
      : (state.themes[state.selectedTheme]?.label || state.selectedTheme)

    // Apply CSS-only settings + page-break indicators after re-inject
    applyPreviewCss()   // also calls insertPageBreaks()
  } catch (err) {
    toast('error', `预览失败：${err.message}`)
  } finally {
    previewLoad.classList.remove('visible')
  }
}

// ── Preview: CSS-only instant update (no server call) ─────────
function applyPreviewCss() {
  const s = previewPanel.style
  s.setProperty('--pv-font-size',   state.fontSize + 'px')
  s.setProperty('--pv-line-height', String(state.lineHeight))
  s.setProperty('--pv-tab-size',    String(state.indentSize))
  s.setProperty('--pv-white-space', state.wrapLines ? 'pre-wrap' : 'pre')
  s.setProperty('--pv-word-break',  state.wrapLines ? 'break-all' : 'normal')
  previewCode.classList.toggle('ln', state.lineNumbers)
  previewCode.classList.toggle('ig', state.indentGuides)
  insertPageBreaks()
}

// ── Page-break indicators ─────────────────────────────────────
// Page heights/widths in mm (portrait height, portrait width)
const PAGE_H = { a4: 297, letter: 279.4, a3: 420, legal: 355.6, a5: 210 }
const PAGE_W = { a4: 210, letter: 215.9, a3: 297, legal: 215.9, a5: 148 }
const PDF_MARGIN_TOP = 14   // mm — must match template.js @page margin
const PDF_MARGIN_BOT = 16   // mm
const PDF_MARGIN_L   = 12
const PDF_MARGIN_R   = 12

/**
 * Build an offscreen replica of the PDF-rendered page layout (same font size,
 * same content width, same pre padding, same wrap behavior) and measure each
 * .line element's Y position. Insert page-break markers in the live preview
 * whenever a line would overflow the current page's remaining height.
 *
 * Accuracy notes:
 *  - Uses real wrapped-height measurement — long wrapped lines take more room.
 *  - Correctly accounts for puppeteer's `scale` (CSS viewport = paper/scale).
 *  - Models the file-header bar on page 1 via a sized spacer in the sandbox.
 *  - Simulates CSS `break-inside: avoid` by resetting the page origin to the
 *    overflowing line's own top — so pages 2..N account for any lines that
 *    effectively got bumped forward.
 */
function insertPageBreaks() {
  previewCode.querySelectorAll('.page-break').forEach(el => el.remove())

  const liveLines = [...previewCode.querySelectorAll('.line')]
  if (!liveLines.length) return

  const livePre = previewCode.querySelector('pre')
  if (!livePre) return

  const key = state.pageSize || 'a4'
  const pageHeightMm = state.landscape ? (PAGE_W[key] || 210) : (PAGE_H[key] || 297)
  const pageWidthMm  = state.landscape ? (PAGE_H[key] || 297) : (PAGE_W[key] || 210)
  const scale = state.scale || 1

  // Puppeteer's `scale` works as if the CSS viewport is (paper / scale):
  // at scale=0.5 the CSS page is 2× as tall, so twice as many lines fit.
  const contentWidthPx  = ((pageWidthMm  - PDF_MARGIN_L   - PDF_MARGIN_R)   / 25.4 * 96) / scale
  const contentHeightPx = ((pageHeightMm - PDF_MARGIN_TOP - PDF_MARGIN_BOT) / 25.4 * 96) / scale
  if (contentHeightPx <= 0 || !isFinite(contentHeightPx)) return

  // Estimate file-header bar CSS height (must match template.js layout):
  //   padding 8px top + 8px bottom + text line + 1px border
  //   text line height ≈ max(fontSize-1, 9) * lineHeight
  const headerFontSize = Math.max(state.fontSize - 1, 9)
  const headerHeightPx = 8 + 8 + headerFontSize * parseFloat(state.lineHeight) + 1

  // Build the sandbox
  const sandbox = document.createElement('div')
  sandbox.setAttribute('aria-hidden', 'true')
  sandbox.style.cssText = `
    position: fixed;
    left: -99999px;
    top: 0;
    width: ${contentWidthPx}px;
    box-sizing: border-box;
    font-family: 'Menlo','Monaco','Cascadia Code','Consolas',monospace;
    font-size: ${state.fontSize}px;
    line-height: ${state.lineHeight};
    visibility: hidden;
    pointer-events: none;
  `

  // Page-1 header spacer (lines[0]'s Y position will include this)
  const headerSpacer = document.createElement('div')
  headerSpacer.style.cssText = `height: ${headerHeightPx}px; width: 100%;`
  sandbox.appendChild(headerSpacer)

  // Replica <pre> with the same padding / wrap / tab rules the PDF uses
  const pre = document.createElement('pre')
  pre.style.cssText = `
    margin: 0;
    padding: ${state.lineNumbers ? '14px 14px 14px 0' : '14px'};
    white-space: ${state.wrapLines ? 'pre-wrap' : 'pre'};
    word-break: ${state.wrapLines ? 'break-all' : 'normal'};
    overflow: visible;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    tab-size: ${state.indentSize};
  `
  const code = document.createElement('code')
  code.style.cssText = 'display: block; font-family: inherit; font-size: inherit;'

  // Clone each .line; when line numbers are on, apply the same left padding
  // the PDF uses (lineNumWidth=42 + 16 = 58).
  const lineNumLeftPad = state.lineNumbers ? '58px' : '0'
  const clonedLines = liveLines.map(l => {
    const clone = l.cloneNode(true)
    clone.style.display = 'block'
    clone.style.minHeight = state.lineHeight + 'em'
    clone.style.paddingLeft = lineNumLeftPad
    code.appendChild(clone)
    return clone
  })
  pre.appendChild(code)
  sandbox.appendChild(pre)
  document.body.appendChild(sandbox)

  // Measure — all numbers are in sandbox-local Y space (px from sandbox top)
  const sandboxTop = sandbox.getBoundingClientRect().top
  let pageStartY = 0
  let pageNum = 1

  for (let i = 0; i < clonedLines.length; i++) {
    const rect = clonedLines[i].getBoundingClientRect()
    const top = rect.top - sandboxTop
    const bottom = rect.bottom - sandboxTop

    if (bottom - pageStartY > contentHeightPx && i > 0) {
      pageNum++
      const marker = document.createElement('span')
      marker.className = 'page-break'
      marker.dataset.label = `第 ${pageNum} 页`
      liveLines[i].parentNode.insertBefore(marker, liveLines[i])
      // New page starts where this line actually begins (simulates break-inside: avoid)
      pageStartY = top
    }
  }

  sandbox.remove()
}

// ── Export ────────────────────────────────────────────────────
async function exportPdf() {
  if (!state.code || state.exporting) return
  state.exporting = true
  exportBtn.classList.add('loading')
  exportLabel.textContent = '生成中…'

  try {
    const isCustom = state.selectedTheme === '__custom__'
    const body = {
      code: state.code, filename: state.filename || 'code.txt', lang: state.lang || 'text',
      theme: isCustom ? (state.customThemeJson?.name || 'custom') : state.selectedTheme,
      customThemeJson: isCustom ? state.customThemeJson : null,
      fontSize: state.fontSize, lineHeight: state.lineHeight, indentSize: state.indentSize,
      lineNumbers: state.lineNumbers, wrapLines: state.wrapLines, indentGuides: state.indentGuides,
      pageSize: state.pageSize, landscape: state.landscape, scale: state.scale,
    }
    const res = await fetch('/api/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error((await res.json()).error || 'Unknown error')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (state.filename || 'code').replace(/\.[^.]+$/, '') + '.pdf'
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast('success', `PDF 已下载：${a.download}`)
  } catch (err) {
    toast('error', `导出失败：${err.message}`)
  } finally {
    state.exporting = false
    exportBtn.classList.remove('loading')
    exportLabel.textContent = '导出 PDF'
  }
}

// ── UI mode toggle ────────────────────────────────────────────
function toggleUiMode() {
  state.uiMode = state.uiMode === 'dark' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-ui', state.uiMode)
  uiModeBtn.innerHTML = state.uiMode === 'dark' ? ICON_MOON : ICON_SUN
}

// ── Toast ─────────────────────────────────────────────────────
function toast(type, message) {
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span class="toast-msg">${message}</span>`
  $('toasts').appendChild(el)
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 200) }, 3200)
}

// ── Event listeners ───────────────────────────────────────────
function bindEvents() {
  // Drop zone
  dropzone.addEventListener('click', () => fileInput.click())
  fileInput.addEventListener('change', () => loadFile(fileInput.files[0]))
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over') })
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'))
  dropzone.addEventListener('drop', e => { e.preventDefault(); dropzone.classList.remove('drag-over'); loadFile(e.dataTransfer.files[0]) })

  // Drop on preview panel
  previewPanel.addEventListener('dragover', e => { if (!state.code) { e.preventDefault(); previewPanel.style.outline = '2px dashed rgba(74,133,255,0.35)' } })
  previewPanel.addEventListener('dragleave', () => { previewPanel.style.outline = '' })
  previewPanel.addEventListener('drop', e => { previewPanel.style.outline = ''; if (e.dataTransfer.files.length) { e.preventDefault(); loadFile(e.dataTransfer.files[0]) } })

  // File clear
  fileClear.addEventListener('click', clearFile)

  // Language override — re-highlight on change
  langOverride.addEventListener('change', () => {
    const v = langOverride.value.trim().toLowerCase()
    if (v && v !== state.lang) {
      state.lang = v
      prevLangLabel.textContent = v
      schedulePreview(0)
    }
  })
  langOverride.addEventListener('keydown', e => { if (e.key === 'Enter') { langOverride.blur() } })

  // Theme search
  themeSearch.addEventListener('input', () => renderThemeList(themeSearch.value))

  // Custom theme
  customInput.addEventListener('change', async () => {
    const file = customInput.files[0]; if (!file) return
    try {
      const stripped = (await file.text()).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      const json = JSON.parse(stripped)
      if (!json.colors && !json.tokenColors) throw new Error('不是有效的 VSCode 主题 JSON')
      state.customThemeJson = json
      state.customThemeLabel = json.name || file.name.replace('.json', '')
      state.selectedTheme = '__custom__'
      renderThemeList(themeSearch.value)
      schedulePreview(0)
      toast('success', `主题「${state.customThemeLabel}」加载成功`)
    } catch (err) { toast('error', `主题加载失败：${err.message}`) }
    customInput.value = ''
  })

  // ── CSS-only options (instant, no server) ──────────────────
  fontSizeRange.addEventListener('input', () => {
    state.fontSize = parseInt(fontSizeRange.value)
    fontSizeVal.textContent = state.fontSize
    applyPreviewCss()
  })
  lineHeightRange.addEventListener('input', () => {
    state.lineHeight = parseFloat(lineHeightRange.value).toFixed(1)
    lineHeightVal.textContent = state.lineHeight
    applyPreviewCss()
  })
  wrapLines.addEventListener('change', () => { state.wrapLines = wrapLines.checked; applyPreviewCss() })
  lineNumbers.addEventListener('change', () => { state.lineNumbers = lineNumbers.checked; applyPreviewCss() })
  indentGuides.addEventListener('change', () => { state.indentGuides = indentGuides.checked; applyPreviewCss() })
  scaleRange.addEventListener('input', () => {
    state.scale = parseFloat(scaleRange.value)
    const d = state.scale.toFixed(2).replace(/\.?0+$/, '')
    scaleVal.textContent = d + '×'
  })

  // Indent — CSS only
  initSegGroup('indent-seg', val => { state.indentSize = parseInt(val); applyPreviewCss() })

  // Page size + orientation — update page-break indicators in preview
  initSegGroup('page-seg',   val => { state.pageSize  = val;                      insertPageBreaks() })
  initSegGroup('orient-seg', val => { state.landscape = val === 'landscape';      insertPageBreaks() })

  // Export
  exportBtn.addEventListener('click', exportPdf)

  // UI mode toggle
  uiModeBtn.addEventListener('click', toggleUiMode)

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key === 'Enter') { e.preventDefault(); exportPdf() }
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); themeSearch.focus() }
  })
}

// ── Start ─────────────────────────────────────────────────────
init()
