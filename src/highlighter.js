/**
 * highlighter.js
 * Wraps shiki to produce syntax-highlighted HTML from source code.
 * shiki uses the exact same TextMate grammars and VSCode theme format as VS Code.
 */

import { createHighlighter, bundledLanguages } from 'shiki'

// File extension → shiki language ID mapping
const EXT_MAP = {
  js: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', mts: 'typescript', cts: 'typescript',
  jsx: 'jsx', tsx: 'tsx',
  py: 'python', pyw: 'python',
  rb: 'ruby',
  go: 'go',
  rs: 'rust',
  java: 'java',
  kt: 'kotlin', kts: 'kotlin',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', 'c++': 'cpp',
  h: 'c', hpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  r: 'r',
  m: 'objective-c',
  scala: 'scala',
  dart: 'dart',
  lua: 'lua',
  hs: 'haskell',
  ex: 'elixir', exs: 'elixir',
  erl: 'erlang',
  ml: 'ocaml',
  fs: 'fsharp', fsx: 'fsharp',
  vue: 'vue',
  svelte: 'svelte',
  html: 'html', htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json', jsonc: 'jsonc',
  yaml: 'yaml', yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  svg: 'xml',
  md: 'markdown', mdx: 'mdx',
  sh: 'bash', bash: 'bash', zsh: 'bash',
  ps1: 'powershell',
  bat: 'bat',
  sql: 'sql',
  graphql: 'graphql', gql: 'graphql',
  tf: 'hcl',
  proto: 'proto',
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  cmake: 'cmake',
  gradle: 'groovy',
  groovy: 'groovy',
  pl: 'perl',
  vim: 'viml',
  tex: 'latex',
  ini: 'ini',
  conf: 'nginx',
  nginx: 'nginx',
  prisma: 'prisma',
  astro: 'astro',
}

/**
 * Detect language from filename/extension.
 */
export function detectLanguage(filename) {
  if (!filename) return 'text'
  const base = filename.toLowerCase().split('/').pop()

  // Match special filenames first
  const specialFiles = {
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'gemfile': 'ruby',
    'rakefile': 'ruby',
    'podfile': 'ruby',
    '.bashrc': 'bash',
    '.zshrc': 'bash',
    '.vimrc': 'viml',
    '.gitignore': 'git-commit',
  }
  if (specialFiles[base]) return specialFiles[base]

  // Match by extension
  const ext = base.includes('.') ? base.split('.').pop() : ''
  return EXT_MAP[ext] || 'text'
}

/**
 * Returns list of all supported language IDs.
 */
export function getSupportedLanguages() {
  return Object.keys(bundledLanguages).sort()
}

/**
 * Create a highlighter instance and generate HTML for the code.
 *
 * @param {string} code - Source code
 * @param {object} options
 * @param {string} options.lang - Language ID
 * @param {string} options.themeId - Shiki built-in theme name
 * @param {object|null} options.customTheme - Parsed VSCode theme JSON (or null)
 * @returns {Promise<{ html: string, bg: string, fg: string }>}
 */
export async function highlight(code, { lang, themeId, customTheme }) {
  // Validate language - fall back to 'text' if unsupported
  const supportedLangs = Object.keys(bundledLanguages)
  const resolvedLang = supportedLangs.includes(lang) ? lang : 'text'

  const highlighter = await createHighlighter({
    themes: customTheme ? [] : [themeId],
    langs: [resolvedLang],
  })

  // Load custom theme if provided (VSCode JSON theme)
  if (customTheme) {
    await highlighter.loadTheme(customTheme)
  }

  const html = highlighter.codeToHtml(code, {
    lang: resolvedLang,
    theme: themeId,
  })

  // Extract background and foreground colors from the generated <pre> style
  const bgMatch = html.match(/background-color:\s*([^;}"]+)/)
  const fgMatch = html.match(/(?:^|[^-])color:\s*([^;}"]+)/)

  const bg = bgMatch ? bgMatch[1].trim() : '#1e1e1e'
  const fg = fgMatch ? fgMatch[1].trim() : '#d4d4d4'

  highlighter.dispose()

  return { html, bg, fg }
}
