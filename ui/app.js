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
  marginH: 12, marginV: 12, fullPageBg: false,
  previewBg: '#282c34',
  exporting: false,
  uiMode: 'light',
  presets: [null, null, null],
  pdfDebounce: null,
  pdfBlobUrl: null,
  pdfGenerating: false,
}

// ── Preset settings keys (what we store/apply) ────────────────
const PRESET_KEYS = [
  'selectedTheme', 'customThemeJson', 'customThemeLabel',
  'fontSize', 'lineHeight', 'indentSize',
  'lineNumbers', 'wrapLines', 'indentGuides',
  'pageSize', 'landscape', 'scale',
  'marginH', 'marginV', 'fullPageBg',
]
const PRESETS_LS_KEY = 'code2pdf-presets'

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
const marginHRange  = $('margin-h')
const marginHVal    = $('margin-h-val')
const marginVRange  = $('margin-v')
const marginVVal    = $('margin-v-val')
const fullPageBgChk = $('full-page-bg')
const exportBtn     = $('export-btn')
const exportLabel   = $('export-label')
const uiModeBtn     = $('ui-mode-btn')
const previewPanel  = $('preview-panel')
const previewBar    = $('preview-bar')
const previewEmpty  = $('preview-empty')
const previewLoad   = $('preview-loading')
const prevFilename  = $('preview-filename')
const prevLangLabel = $('preview-lang-label')
const prevLines     = $('preview-lines')
const prevTheme     = $('preview-theme-label')
const presetsRow    = $('presets-row')
const pdfWrap       = document.querySelector('.pdf-wrap')
const pdfObject     = $('pdf-object')

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
  loadPresets()
  renderPresets()
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
  if (id !== '__custom__') {
    state.previewBg = THEME_BG[id] || '#1e1e1e'
  }
  renderThemeList(themeSearch.value)
  schedulePdfPreview()
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

    schedulePdfPreview(1000)
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
  previewPanel.style.background = ''
  pdfObject.data = ''
  pdfWrap.classList.remove('visible')
  if (state.pdfBlobUrl) { URL.revokeObjectURL(state.pdfBlobUrl); state.pdfBlobUrl = null }
}

// ── PDF Preview: auto-generate and show inline ────────────────
function schedulePdfPreview(delay = 800) {
  clearTimeout(state.pdfDebounce)
  state.pdfDebounce = setTimeout(fetchPdfPreview, delay)
}

async function fetchPdfPreview() {
  if (!state.code || state.pdfGenerating) return
  state.pdfGenerating = true
  previewLoad.classList.add('visible')

  try {
    const isCustom = state.selectedTheme === '__custom__'
    const body = {
      code: state.code, filename: state.filename || 'code.txt', lang: state.lang || 'text',
      theme: isCustom ? (state.customThemeJson?.name || 'custom') : state.selectedTheme,
      customThemeJson: isCustom ? state.customThemeJson : null,
      fontSize: state.fontSize, lineHeight: state.lineHeight, indentSize: state.indentSize,
      lineNumbers: state.lineNumbers, wrapLines: state.wrapLines, indentGuides: state.indentGuides,
      pageSize: state.pageSize, landscape: state.landscape, scale: state.scale,
      marginH: state.marginH, marginV: state.marginV, fullPageBg: state.fullPageBg,
    }
    const res = await fetch('/api/preview-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Unknown error')

    const blob = await res.blob()
    if (state.pdfBlobUrl) URL.revokeObjectURL(state.pdfBlobUrl)
    state.pdfBlobUrl = URL.createObjectURL(blob)

    pdfObject.data = state.pdfBlobUrl
    pdfWrap.classList.add('visible')
    previewEmpty.classList.add('hidden')

    prevTheme.textContent = isCustom
      ? (state.customThemeLabel || 'Custom')
      : (state.themes[state.selectedTheme]?.label || state.selectedTheme)
  } catch (err) {
    toast('error', `PDF 预览失败：${err.message}`)
  } finally {
    state.pdfGenerating = false
    previewLoad.classList.remove('visible')
  }
}

// ── Export ────────────────────────────────────────────────────
async function exportPdf() {
  if (!state.code || state.exporting) return
  state.exporting = true
  exportBtn.classList.add('loading')
  exportLabel.textContent = '导出 PDF'
  showExportOverlay()

  try {
    const isCustom = state.selectedTheme === '__custom__'
    const body = {
      code: state.code, filename: state.filename || 'code.txt', lang: state.lang || 'text',
      theme: isCustom ? (state.customThemeJson?.name || 'custom') : state.selectedTheme,
      customThemeJson: isCustom ? state.customThemeJson : null,
      fontSize: state.fontSize, lineHeight: state.lineHeight, indentSize: state.indentSize,
      lineNumbers: state.lineNumbers, wrapLines: state.wrapLines, indentGuides: state.indentGuides,
      pageSize: state.pageSize, landscape: state.landscape, scale: state.scale,
      marginH: state.marginH, marginV: state.marginV, fullPageBg: state.fullPageBg,
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
    hideExportOverlay()
  }
}

// ── Presets ───────────────────────────────────────────────────
function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESETS_LS_KEY)
    if (!raw) return
    const arr = JSON.parse(raw)
    if (Array.isArray(arr) && arr.length === 3) state.presets = arr
  } catch { /* ignore */ }
}

function savePresets() {
  try { localStorage.setItem(PRESETS_LS_KEY, JSON.stringify(state.presets)) } catch { /* ignore */ }
}

function renderPresets() {
  const slots = presetsRow.querySelectorAll('.preset-slot')
  slots.forEach((slot, i) => {
    const p = state.presets[i]
    const label = slot.querySelector('.preset-slot-label')
    if (p) {
      slot.classList.add('filled')
      const themeLabel = p.selectedTheme === '__custom__'
        ? (p.customThemeLabel || 'Custom')
        : (state.themes[p.selectedTheme]?.label || p.selectedTheme)
      label.textContent = `${themeLabel} · ${p.fontSize}px`
      slot.title = `点击应用预设 ${i + 1}`
    } else {
      slot.classList.remove('filled')
      label.textContent = '空'
      slot.title = '点击保存当前设置为预设'
    }
  })
}

function capturePreset() {
  const p = {}
  for (const k of PRESET_KEYS) p[k] = state[k]
  return p
}

function applyPreset(p) {
  for (const k of PRESET_KEYS) if (p[k] !== undefined) state[k] = p[k]

  // Sync UI controls
  fontSizeRange.value = state.fontSize
  fontSizeVal.textContent = state.fontSize
  lineHeightRange.value = state.lineHeight
  lineHeightVal.textContent = state.lineHeight
  lineNumbers.checked = state.lineNumbers
  wrapLines.checked = state.wrapLines
  indentGuides.checked = state.indentGuides
  scaleRange.value = state.scale
  scaleVal.textContent = state.scale.toFixed(2).replace(/\.?0+$/, '') + '×'
  marginHRange.value = state.marginH
  marginHVal.textContent = state.marginH + 'mm'
  marginVRange.value = state.marginV
  marginVVal.textContent = state.marginV + 'mm'
  fullPageBgChk.checked = state.fullPageBg

  const setSeg = (id, val) => {
    const g = $(id)
    if (!g) return
    g.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.value == val))
  }
  setSeg('indent-seg', state.indentSize)
  setSeg('page-seg', state.pageSize)
  setSeg('orient-seg', state.landscape ? 'landscape' : 'portrait')

  renderThemeList(themeSearch.value)
  schedulePdfPreview(1000)
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

  // Language override — regenerate PDF on change
  langOverride.addEventListener('change', () => {
    const v = langOverride.value.trim().toLowerCase()
    if (v && v !== state.lang) {
      state.lang = v
      prevLangLabel.textContent = v
      schedulePdfPreview()
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
      schedulePdfPreview()
      toast('success', `主题「${state.customThemeLabel}」加载成功`)
    } catch (err) { toast('error', `主题加载失败：${err.message}`) }
    customInput.value = ''
  })

  // Options — all trigger PDF regeneration
  fontSizeRange.addEventListener('input', () => {
    state.fontSize = parseInt(fontSizeRange.value)
    fontSizeVal.textContent = state.fontSize
    schedulePdfPreview()
  })
  lineHeightRange.addEventListener('input', () => {
    state.lineHeight = parseFloat(lineHeightRange.value).toFixed(1)
    lineHeightVal.textContent = state.lineHeight
    schedulePdfPreview()
  })
  wrapLines.addEventListener('change', () => { state.wrapLines = wrapLines.checked; schedulePdfPreview() })
  lineNumbers.addEventListener('change', () => { state.lineNumbers = lineNumbers.checked; schedulePdfPreview() })
  indentGuides.addEventListener('change', () => { state.indentGuides = indentGuides.checked; schedulePdfPreview() })
  scaleRange.addEventListener('input', () => {
    state.scale = parseFloat(scaleRange.value)
    const d = state.scale.toFixed(2).replace(/\.?0+$/, '')
    scaleVal.textContent = d + '×'
    schedulePdfPreview()
  })

  marginHRange.addEventListener('input', () => {
    state.marginH = parseInt(marginHRange.value)
    marginHVal.textContent = state.marginH + 'mm'
    schedulePdfPreview()
  })
  marginVRange.addEventListener('input', () => {
    state.marginV = parseInt(marginVRange.value)
    marginVVal.textContent = state.marginV + 'mm'
    schedulePdfPreview()
  })
  fullPageBgChk.addEventListener('change', () => { state.fullPageBg = fullPageBgChk.checked; schedulePdfPreview() })

  initSegGroup('indent-seg', val => { state.indentSize = parseInt(val); schedulePdfPreview() })
  initSegGroup('page-seg',   val => { state.pageSize  = val; schedulePdfPreview() })
  initSegGroup('orient-seg', val => { state.landscape = val === 'landscape'; schedulePdfPreview() })

  // Presets — click slot: apply if filled, save if empty; × clears
  presetsRow.addEventListener('click', e => {
    const clearBtn = e.target.closest('.preset-slot-clear')
    if (clearBtn) {
      e.stopPropagation()
      const i = parseInt(clearBtn.dataset.clear)
      state.presets[i] = null
      savePresets()
      renderPresets()
      toast('success', `预设 ${i + 1} 已清除`)
      return
    }
    const slot = e.target.closest('.preset-slot')
    if (!slot) return
    const i = parseInt(slot.dataset.idx)
    if (state.presets[i]) {
      applyPreset(state.presets[i])
      toast('success', `已应用预设 ${i + 1}`)
    } else {
      state.presets[i] = capturePreset()
      savePresets()
      renderPresets()
      toast('success', `已保存预设 ${i + 1}`)
    }
  })

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

// ── Export overlay ────────────────────────────────────────────
// Animation is inlined in index.html — immune to JS cache.
const _exportOverlay = document.getElementById('export-overlay')

function showExportOverlay() {
  _exportOverlay.classList.add('visible')
  _exportOverlay.removeAttribute('aria-hidden')
}
function hideExportOverlay() {
  _exportOverlay.classList.remove('visible')
  _exportOverlay.setAttribute('aria-hidden', 'true')
}
