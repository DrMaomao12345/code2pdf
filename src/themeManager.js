/**
 * themeManager.js
 * Manages built-in themes (shiki/VSCode compatible) and custom theme loading.
 * Custom themes must be standard VSCode JSON theme files.
 */

import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

// All built-in shiki themes (VSCode-compatible)
export const BUILTIN_THEMES = {
  // Dark themes
  'one-dark-pro':            { label: 'One Dark Pro',           type: 'dark' },
  'github-dark':             { label: 'GitHub Dark',            type: 'dark' },
  'github-dark-default':     { label: 'GitHub Dark Default',    type: 'dark' },
  'github-dark-dimmed':      { label: 'GitHub Dark Dimmed',     type: 'dark' },
  'dracula':                 { label: 'Dracula',                type: 'dark' },
  'dracula-soft':            { label: 'Dracula Soft',           type: 'dark' },
  'tokyo-night':             { label: 'Tokyo Night',            type: 'dark' },
  'night-owl':               { label: 'Night Owl',              type: 'dark' },
  'monokai':                 { label: 'Monokai',                type: 'dark' },
  'nord':                    { label: 'Nord',                   type: 'dark' },
  'dark-plus':               { label: 'Dark+ (VS Code Default)',type: 'dark' },
  'material-theme':          { label: 'Material Theme',         type: 'dark' },
  'material-theme-darker':   { label: 'Material Theme Darker',  type: 'dark' },
  'material-theme-ocean':    { label: 'Material Theme Ocean',   type: 'dark' },
  'material-theme-palenight':{ label: 'Material Theme Palenight',type:'dark' },
  'catppuccin-mocha':        { label: 'Catppuccin Mocha',       type: 'dark' },
  'catppuccin-macchiato':    { label: 'Catppuccin Macchiato',   type: 'dark' },
  'catppuccin-frappe':       { label: 'Catppuccin Frappé',      type: 'dark' },
  'rose-pine':               { label: 'Rosé Pine',              type: 'dark' },
  'rose-pine-moon':          { label: 'Rosé Pine Moon',         type: 'dark' },
  'synthwave-84':            { label: 'SynthWave \'84',         type: 'dark' },
  'ayu-dark':                { label: 'Ayu Dark',               type: 'dark' },
  'poimandres':              { label: 'Poimandres',             type: 'dark' },
  'houston':                 { label: 'Houston',                type: 'dark' },
  'vitesse-dark':            { label: 'Vitesse Dark',           type: 'dark' },
  'vitesse-black':           { label: 'Vitesse Black',          type: 'dark' },
  'slack-dark':              { label: 'Slack Dark',             type: 'dark' },
  'solarized-dark':          { label: 'Solarized Dark',         type: 'dark' },
  'everforest-dark':         { label: 'Everforest Dark',        type: 'dark' },
  'andromeeda':              { label: 'Andromeeda',             type: 'dark' },
  'aurora-x':                { label: 'Aurora X',               type: 'dark' },
  'laserwave':               { label: 'Laserwave',              type: 'dark' },
  'plastic':                 { label: 'Plastic',                type: 'dark' },
  'vesper':                  { label: 'Vesper',                 type: 'dark' },
  'red':                     { label: 'Red',                    type: 'dark' },
  'min-dark':                { label: 'Min Dark',               type: 'dark' },

  // Light themes
  'github-light':            { label: 'GitHub Light',           type: 'light' },
  'github-light-default':    { label: 'GitHub Light Default',   type: 'light' },
  'github-light-high-contrast':{ label: 'GitHub Light High Contrast', type: 'light' },
  'one-light':               { label: 'One Light',              type: 'light' },
  'catppuccin-latte':        { label: 'Catppuccin Latte',       type: 'light' },
  'rose-pine-dawn':          { label: 'Rosé Pine Dawn',         type: 'light' },
  'material-theme-lighter':  { label: 'Material Theme Lighter', type: 'light' },
  'vitesse-light':           { label: 'Vitesse Light',          type: 'light' },
  'solarized-light':         { label: 'Solarized Light',        type: 'light' },
  'everforest-light':        { label: 'Everforest Light',       type: 'light' },
  'snazzy-light':            { label: 'Snazzy Light',           type: 'light' },
  'slack-ochin':             { label: 'Slack Ochin',            type: 'light' },
  'min-light':               { label: 'Min Light',              type: 'light' },
}

/**
 * Returns all built-in theme IDs grouped by type.
 */
export function listThemes() {
  return BUILTIN_THEMES
}

/**
 * Load a custom VSCode theme JSON file.
 * Returns the parsed theme object ready to pass to shiki.
 */
export async function loadCustomTheme(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Theme file not found: ${filePath}`)
  }
  const raw = await readFile(filePath, 'utf-8')
  let theme
  try {
    // VSCode theme files may use JSONC (JSON with Comments), strip comments first
    const stripped = raw
      .replace(/\/\/.*$/gm, '')       // single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // block comments
    theme = JSON.parse(stripped)
  } catch {
    throw new Error(`Failed to parse theme file: ${filePath}. Ensure it is a valid VSCode JSON theme.`)
  }
  if (!theme.colors && !theme.tokenColors) {
    throw new Error(`Invalid VSCode theme file: missing "colors" or "tokenColors" fields.`)
  }
  // Ensure it has a name
  if (!theme.name) {
    theme.name = 'custom-theme'
  }
  return theme
}

/**
 * Resolve theme: returns { themeId, customTheme }
 * - If name matches a built-in theme, themeId is the shiki theme ID
 * - If name is a file path, loads it as a custom VSCode theme JSON
 */
export async function resolveTheme(nameOrPath) {
  if (BUILTIN_THEMES[nameOrPath]) {
    return { themeId: nameOrPath, customTheme: null }
  }
  // Check if it looks like a file path or the built-in lookup failed
  const customTheme = await loadCustomTheme(nameOrPath)
  return { themeId: customTheme.name, customTheme }
}
