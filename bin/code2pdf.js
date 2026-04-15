#!/usr/bin/env node
/**
 * code2pdf CLI
 * Export source code to PDF with VSCode-compatible syntax highlighting.
 *
 * Usage:
 *   code2pdf <file> [options]
 *   code2pdf --list-themes
 *   code2pdf --list-languages
 */

import { program } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import path from 'path'
import { existsSync } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { readFile } from 'fs/promises'

import {
  convertToPdf,
  listThemes,
  getSupportedLanguages,
  getPageSizes,
  detectLanguage,
  BUILTIN_THEMES,
} from '../src/index.js'

// Read package.json for version
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  await readFile(path.join(__dirname, '..', 'package.json'), 'utf-8')
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printThemeTable(themes) {
  const darkThemes = Object.entries(themes)
    .filter(([, v]) => v.type === 'dark')
    .map(([id, v]) => ({ id, label: v.label }))
  const lightThemes = Object.entries(themes)
    .filter(([, v]) => v.type === 'light')
    .map(([id, v]) => ({ id, label: v.label }))

  console.log(chalk.bold('\n  Dark themes:'))
  for (const { id, label } of darkThemes) {
    console.log(`    ${chalk.cyan(id.padEnd(34))} ${chalk.gray(label)}`)
  }

  console.log(chalk.bold('\n  Light themes:'))
  for (const { id, label } of lightThemes) {
    console.log(`    ${chalk.cyan(id.padEnd(34))} ${chalk.gray(label)}`)
  }

  console.log(
    chalk.dim(`\n  Total: ${Object.keys(themes).length} built-in themes\n`) +
    chalk.dim('  You can also use any VSCode theme JSON file with --theme <path/to/theme.json>\n')
  )
}

function printLanguageList(langs) {
  const cols = 6
  const width = 18
  console.log(chalk.bold(`\n  Supported languages (${langs.length}):\n`))
  for (let i = 0; i < langs.length; i += cols) {
    const row = langs.slice(i, i + cols).map(l => l.padEnd(width)).join('')
    console.log('  ' + chalk.cyan(row))
  }
  console.log()
}

// ─── CLI definition ───────────────────────────────────────────────────────────

program
  .name('code2pdf')
  .description('Export source code to PDF with VSCode-compatible syntax highlighting')
  .version(pkg.version, '-v, --version')
  .argument('[file]', 'Source code file to convert')
  .option('-o, --output <path>', 'Output PDF file path (default: <input>.pdf)')
  .option(
    '-t, --theme <name|path>',
    'Theme name or path to VSCode theme JSON (default: one-dark-pro)',
    'one-dark-pro'
  )
  .option('-l, --language <lang>', 'Override language detection (e.g. python, go, rust)')
  .option('-s, --font-size <n>', 'Font size in px (default: 12)', (v) => parseInt(v, 10), 12)
  .option('-n, --line-numbers', 'Show line numbers', false)
  .option('--no-wrap', 'Disable line wrapping (long lines extend beyond page)')
  .option(
    '-p, --page-size <size>',
    `Page size: ${getPageSizes().join(', ')} (default: a4)`,
    'a4'
  )
  .option('--landscape', 'Landscape page orientation', false)
  .option('--scale <n>', 'Content scale factor 0.1–2.0 (default: 1.0)', (v) => parseFloat(v), 1.0)
  .option('--list-themes', 'List all built-in themes and exit')
  .option('--list-languages', 'List all supported languages and exit')

program.parse()

const opts = program.opts()
const [inputFile] = program.args

// ─── Handle informational flags ───────────────────────────────────────────────

if (opts.listThemes) {
  printThemeTable(listThemes())
  process.exit(0)
}

if (opts.listLanguages) {
  printLanguageList(getSupportedLanguages())
  process.exit(0)
}

// ─── Validate input ───────────────────────────────────────────────────────────

if (!inputFile) {
  console.error(chalk.red('Error: No input file specified.\n'))
  program.help()
  process.exit(1)
}

if (!existsSync(inputFile)) {
  console.error(chalk.red(`Error: File not found: ${inputFile}`))
  process.exit(1)
}

const outputPath = opts.output || inputFile.replace(/(\.[^.]+)?$/, '.pdf')

// Validate theme (warn if unknown built-in name and not a file path)
if (!BUILTIN_THEMES[opts.theme] && !existsSync(opts.theme)) {
  console.warn(
    chalk.yellow(`Warning: "${opts.theme}" is not a known built-in theme and no file was found at that path.`) +
    '\n' +
    chalk.yellow('Run `code2pdf --list-themes` to see available themes.')
  )
}

// Validate page size
if (!getPageSizes().includes(opts.pageSize.toLowerCase())) {
  console.error(
    chalk.red(`Error: Invalid page size "${opts.pageSize}". Valid options: ${getPageSizes().join(', ')}`)
  )
  process.exit(1)
}

// ─── Run conversion ───────────────────────────────────────────────────────────

const detectedLang = opts.language || detectLanguage(inputFile)
const resolvedOutput = path.resolve(outputPath)

console.log()
console.log(chalk.bold('  code2pdf') + chalk.dim(` v${pkg.version}`))
console.log(chalk.dim('  ─────────────────────────────────'))
console.log(`  ${chalk.dim('Input :')} ${chalk.white(path.resolve(inputFile))}`)
console.log(`  ${chalk.dim('Output:')} ${chalk.white(resolvedOutput)}`)
console.log(`  ${chalk.dim('Lang  :')} ${chalk.cyan(detectedLang)}`)
console.log(`  ${chalk.dim('Theme :')} ${chalk.cyan(opts.theme)}`)
console.log(`  ${chalk.dim('Size  :')} ${chalk.cyan(opts.pageSize.toUpperCase())}`)
console.log()

const spinner = ora({ text: 'Generating PDF…', color: 'cyan' }).start()

try {
  await convertToPdf({
    input: inputFile,
    output: resolvedOutput,
    language: opts.language,
    theme: opts.theme,
    fontSize: opts.fontSize,
    lineNumbers: opts.lineNumbers,
    wrapLines: opts.wrap,
    pageSize: opts.pageSize,
    landscape: opts.landscape,
    scale: opts.scale,
  })

  spinner.succeed(chalk.green('PDF generated successfully!'))
  console.log(`\n  ${chalk.bold('Saved to:')} ${chalk.underline(resolvedOutput)}\n`)
} catch (err) {
  spinner.fail(chalk.red('Failed to generate PDF'))
  console.error('\n' + chalk.red(err.message))
  if (process.env.DEBUG) console.error(err.stack)
  process.exit(1)
}
