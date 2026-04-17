# code2pdf（CN）

将源代码导出为带有语法高亮的 PDF 文件，支持与 VSCode 完全兼容的颜色主题配置。

Export source code to beautiful PDF files with VSCode-compatible syntax highlighting.

---

## ✨ 特性 / Features

- **VSCode 主题完全兼容** — 使用与 VSCode 相同的 [shiki](https://shiki.style) 高亮引擎（TextMate 语法 + VSCode 主题 JSON）
- **50+ 内置主题** — One Dark Pro、Dracula、Tokyo Night、GitHub、Catppuccin 等
- **自定义主题** — 直接导入任何 VSCode `.json` 主题文件
- **100+ 编程语言** — 自动识别语言，也可手动指定
- **本地 Web UI** — `npm run ui` 启动浏览器可视化界面，拖拽文件、参数变化自动生成 PDF 并内联预览
- **精细排版** — 字号、行间距、缩进、缩进参考线、行号、自动换行均可调整
- **VSCode 风格缩进参考线** — 连续竖直线标记缩进层级（空行处自动延续），预览与 PDF 导出完全一致
- **多种页面尺寸** — A4、Letter、A3、Legal + 横向/纵向 + 内容缩放
- **预设记忆** — Web UI 提供 3 个预设槽位，保存/加载常用设置组合
- **PDF 实时预览** — 任意参数变化后自动重新生成 PDF，内联显示真实渲染结果
- **CLI + Node.js API** — 命令行工具 + 可编程接口

---

## 安装 / Install

### 从源码安装（推荐）

```bash
git clone https://github.com/DrMaomao12345/code2pdf.git
cd code2pdf
npm install
```

> 首次安装会自动下载 Chromium（约 120MB），用于 PDF 渲染。

### 全局安装

```bash
npm install -g code2pdf
```

### 使用 Claude Code 一键搭建（推荐）

直接复制以下提示词让 AI 帮你完成安装和配置：
```
帮我安装并且启动code2pdf项目： https://github.com/DrMaomao12345/code2pdf.git
```

---

## 快速开始 / Quick Start

```bash
# 基本用法：将 main.py 转换为 main.pdf
code2pdf main.py

# 指定输出路径
code2pdf main.py -o output/docs/main.pdf

# 使用特定主题
code2pdf main.py -t dracula

# 显示行号，调整字号
code2pdf main.py --line-numbers --font-size 11

# 显示缩进参考线（便于查看嵌套结构）
code2pdf main.py --indent-guides

# 使用自己的 VSCode 主题 JSON 文件
code2pdf main.py -t ~/themes/my-custom-theme.json

# 横向排列（适合宽代码）
code2pdf main.py --landscape

# Letter 纸张，不自动换行
code2pdf main.py --page-size letter --no-wrap
```

---

## 主题配置 / Theme Configuration

### 使用内置主题

```bash
# 列出所有可用主题
code2pdf --list-themes

# 使用 GitHub Light（适合打印）
code2pdf index.ts -t github-light

# 使用 One Dark Pro（默认）
code2pdf index.ts -t one-dark-pro
```

### 内置主题列表（部分）

| 主题 ID | 名称 | 类型 |
|---|---|---|
| `one-dark-pro` | One Dark Pro | 深色 |
| `github-dark` | GitHub Dark | 深色 |
| `github-light` | GitHub Light | 浅色 |
| `dracula` | Dracula | 深色 |
| `tokyo-night` | Tokyo Night | 深色 |
| `monokai` | Monokai | 深色 |
| `nord` | Nord | 深色 |
| `solarized-dark` | Solarized Dark | 深色 |
| `solarized-light` | Solarized Light | 浅色 |
| `catppuccin-mocha` | Catppuccin Mocha | 深色 |
| `catppuccin-latte` | Catppuccin Latte | 浅色 |
| `rose-pine` | Rosé Pine | 深色 |
| `synthwave-84` | SynthWave '84 | 深色 |
| `dark-plus` | Dark+ (VS Code 默认) | 深色 |
| `one-light` | One Light | 浅色 |

运行 `code2pdf --list-themes` 查看全部 50+ 主题。

### 使用自定义 VSCode 主题

1. 从 VSCode 扩展市场下载或导出主题 `.json` 文件
2. 主题文件格式需符合 [VSCode Color Theme](https://code.visualstudio.com/api/extension-guides/color-theme) 规范（包含 `colors` 和/或 `tokenColors` 字段）

```bash
code2pdf app.go -t /path/to/my-theme.json
```

主题 JSON 示例结构：

```json
{
  "name": "My Custom Theme",
  "type": "dark",
  "colors": {
    "editor.background": "#1a1a2e",
    "editor.foreground": "#e0e0e0"
  },
  "tokenColors": [
    {
      "scope": ["keyword"],
      "settings": { "foreground": "#c792ea", "fontStyle": "bold" }
    }
  ]
}
```

---

## 完整参数 / CLI Options

```
Usage: code2pdf [options] <file>

Arguments:
  file                    Source code file to convert

Options:
  -v, --version           Show version number
  -o, --output <path>     Output PDF file path (default: <input>.pdf)
  -t, --theme <name|path> Theme name or path to VSCode theme JSON
                          (default: "one-dark-pro")
  -l, --language <lang>   Override language detection
  -s, --font-size <n>     Font size in px (default: 12)
  -n, --line-numbers      Show line numbers (default: false)
  --indent-guides         Draw vertical indent guide lines (default: false)
  --no-wrap               Disable line wrapping
  -p, --page-size <size>  Page size: a4, letter, a3, legal, a5, tabloid
                          (default: "a4")
  --landscape             Landscape orientation (default: false)
  --scale <n>             Content scale factor 0.1–2.0 (default: 1.0)
  --list-themes           List all built-in themes and exit
  --list-languages        List all supported languages and exit
  -h, --help              Show help
```

---

## Node.js API

```javascript
import { convertToPdf, convertCodeToPdf } from 'code2pdf'

// 从文件转换
await convertToPdf({
  input: 'src/index.ts',
  output: 'docs/index.pdf',
  theme: 'tokyo-night',
  fontSize: 12,
  lineNumbers: true,
  pageSize: 'a4',
})

// 从字符串转换
await convertCodeToPdf({
  code: 'const hello = "world"',
  language: 'javascript',
  filename: 'hello.js',
  output: 'hello.pdf',
  theme: 'github-light',
})
```

### API 参考

```typescript
convertToPdf(options: {
  input: string          // 输入文件路径
  output: string         // 输出 PDF 路径
  language?: string      // 语言 ID，不填则自动检测
  theme?: string         // 主题名称或 VSCode 主题 JSON 路径
  fontSize?: number      // 字号 (default: 12)
  lineNumbers?: boolean  // 显示行号 (default: false)
  wrapLines?: boolean    // 换行 (default: true)
  indentGuides?: boolean // 缩进参考线 (default: false)
  pageSize?: string      // 页面尺寸 (default: 'a4')
  landscape?: boolean    // 横向 (default: false)
  scale?: number         // 缩放 (default: 1.0)
}): Promise<void>
```

---

## 支持的语言 / Supported Languages

```bash
code2pdf --list-languages
```

支持 100+ 种语言，包括：JavaScript/TypeScript、Python、Rust、Go、Java、C/C++、C#、PHP、Ruby、Swift、Kotlin、Dart、SQL、Shell、HTML/CSS、Markdown 等。

---

## 技术栈 / Tech Stack

| 组件 | 作用 |
|---|---|
| [shiki](https://shiki.style) | VSCode 同款语法高亮引擎 |
| [puppeteer](https://pptr.dev) | Headless Chromium PDF 渲染 |
| [commander](https://github.com/tj/commander.js) | CLI 参数解析 |

---

## 本地 Web UI / Local Web UI

除 CLI 外，项目附带一个本地 Web 界面，可在浏览器中拖拽文件、切换主题、
参数变化自动生成 PDF 并内联预览真实渲染结果：

```bash
npm run ui
```

启动后会自动打开 `http://localhost:3131`。

特性：

- 拖拽或点击上传任意源代码文件
- 侧边栏搜索 50+ 主题，支持导入自定义 VSCode `.json` 主题
- 字号、行间距、缩进、行号、自动换行、缩进参考线任意调整
- **PDF 实时预览** — 任意参数变化（主题/字号/纸张等）后自动重新生成，右侧直接内联显示真实 PDF
- **VSCode 风格缩进参考线** — 连续竖直线，空行处自动延续，预览与导出完全一致
- 页面尺寸 / 横竖向 / 内容缩放，所见即所得
- **3 个预设槽位** — 保存常用设置组合，一键切换（持久化到 localStorage）
- 深色 / 浅色界面主题一键切换

---

## 开发 / Development

```bash
git clone https://github.com/DrMaomao12345/code2pdf
cd code2pdf
npm install

# CLI
node bin/code2pdf.js src/index.js --line-numbers

# Web UI
npm run ui
```

---

## License

MIT License

---

---

# code2pdf (English)

Export source code to beautiful PDF files with VSCode-compatible syntax highlighting.

---

## Features

- **Full VSCode theme compatibility** — Uses the same [shiki](https://shiki.style) highlighting engine as VSCode (TextMate grammars + VSCode theme JSON)
- **50+ built-in themes** — One Dark Pro, Dracula, Tokyo Night, GitHub, Catppuccin, and more
- **Custom themes** — Import any VSCode `.json` theme file directly
- **100+ programming languages** — Automatic language detection with manual override
- **Local Web UI** — Run `npm run ui` for a browser-based visual interface with drag-and-drop and live inline PDF preview
- **Fine-grained typography** — Font size, line height, indent size, indent guides, line numbers, word wrap
- **VSCode-style indent guides** — Continuous vertical lines marking indent levels (carried through blank lines), consistent between preview and PDF export
- **Multiple page sizes** — A4, Letter, A3, Legal + portrait/landscape + content scaling
- **Preset memory** — 3 preset slots in Web UI to save/load favorite setting combinations (persisted to localStorage)
- **Live PDF preview** — Any parameter change (theme, font size, page size, etc.) auto-regenerates the PDF and displays it inline
- **CLI + Node.js API** — Command-line tool + programmatic interface

---

## Install

### From source (recommended)

```bash
git clone https://github.com/DrMaomao12345/code2pdf.git
cd code2pdf
npm install
```

> Chromium (~120MB) will be downloaded automatically on first install for PDF rendering.

### Global install

```bash
npm install -g code2pdf
```

### One-click setup with Claude Code

Paste this prompt to set up automatically:

```
Set up the code2pdf project: git clone https://github.com/DrMaomao12345/code2pdf.git
```

---

## Quick Start

```bash
# Basic: convert main.py to main.pdf
code2pdf main.py

# Specify output path
code2pdf main.py -o output/docs/main.pdf

# Use a specific theme
code2pdf main.py -t dracula

# Show line numbers, adjust font size
code2pdf main.py --line-numbers --font-size 11

# Show indent guides (great for nested code)
code2pdf main.py --indent-guides

# Use your own VSCode theme JSON file
code2pdf main.py -t ~/themes/my-custom-theme.json

# Landscape orientation (good for wide code)
code2pdf main.py --landscape

# Letter paper, no word wrap
code2pdf main.py --page-size letter --no-wrap
```

---

## Theme Configuration

### Built-in themes

```bash
# List all available themes
code2pdf --list-themes

# Use GitHub Light (great for printing)
code2pdf index.ts -t github-light

# Use One Dark Pro (default)
code2pdf index.ts -t one-dark-pro
```

### Built-in theme list (partial)

| Theme ID | Name | Type |
|---|---|---|
| `one-dark-pro` | One Dark Pro | Dark |
| `github-dark` | GitHub Dark | Dark |
| `github-light` | GitHub Light | Light |
| `dracula` | Dracula | Dark |
| `tokyo-night` | Tokyo Night | Dark |
| `monokai` | Monokai | Dark |
| `nord` | Nord | Dark |
| `solarized-dark` | Solarized Dark | Dark |
| `solarized-light` | Solarized Light | Light |
| `catppuccin-mocha` | Catppuccin Mocha | Dark |
| `catppuccin-latte` | Catppuccin Latte | Light |
| `rose-pine` | Rosé Pine | Dark |
| `synthwave-84` | SynthWave '84 | Dark |
| `dark-plus` | Dark+ (VS Code default) | Dark |
| `one-light` | One Light | Light |

Run `code2pdf --list-themes` to see all 50+ themes.

### Custom VSCode themes

1. Download or export a `.json` theme file from the VSCode marketplace
2. The theme file must follow the [VSCode Color Theme](https://code.visualstudio.com/api/extension-guides/color-theme) specification (containing `colors` and/or `tokenColors` fields)

```bash
code2pdf app.go -t /path/to/my-theme.json
```

---

## CLI Options

```
Usage: code2pdf [options] <file>

Arguments:
  file                    Source code file to convert

Options:
  -v, --version           Show version number
  -o, --output <path>     Output PDF file path (default: <input>.pdf)
  -t, --theme <name|path> Theme name or path to VSCode theme JSON
                          (default: "one-dark-pro")
  -l, --language <lang>   Override language detection
  -s, --font-size <n>     Font size in px (default: 12)
  -n, --line-numbers      Show line numbers (default: false)
  --indent-guides         Draw vertical indent guide lines (default: false)
  --no-wrap               Disable line wrapping
  -p, --page-size <size>  Page size: a4, letter, a3, legal, a5, tabloid
                          (default: "a4")
  --landscape             Landscape orientation (default: false)
  --scale <n>             Content scale factor 0.1–2.0 (default: 1.0)
  --list-themes           List all built-in themes and exit
  --list-languages        List all supported languages and exit
  -h, --help              Show help
```

---

## Node.js API

```javascript
import { convertToPdf, convertCodeToPdf } from 'code2pdf'

// Convert from file
await convertToPdf({
  input: 'src/index.ts',
  output: 'docs/index.pdf',
  theme: 'tokyo-night',
  fontSize: 12,
  lineNumbers: true,
  pageSize: 'a4',
})

// Convert from string
await convertCodeToPdf({
  code: 'const hello = "world"',
  language: 'javascript',
  filename: 'hello.js',
  output: 'hello.pdf',
  theme: 'github-light',
})
```

### API Reference

```typescript
convertToPdf(options: {
  input: string          // Input file path
  output: string         // Output PDF path
  language?: string      // Language ID (auto-detected if omitted)
  theme?: string         // Theme name or path to VSCode theme JSON
  fontSize?: number      // Font size in px (default: 12)
  lineNumbers?: boolean  // Show line numbers (default: false)
  wrapLines?: boolean    // Word wrap (default: true)
  indentGuides?: boolean // Indent guides (default: false)
  pageSize?: string      // Page size (default: 'a4')
  landscape?: boolean    // Landscape orientation (default: false)
  scale?: number         // Content scale (default: 1.0)
}): Promise<void>
```

---

## Supported Languages

```bash
code2pdf --list-languages
```

Supports 100+ languages including: JavaScript/TypeScript, Python, Rust, Go, Java, C/C++, C#, PHP, Ruby, Swift, Kotlin, Dart, SQL, Shell, HTML/CSS, Markdown, and more.

---

## Web UI

In addition to the CLI, the project includes a local web interface for drag-and-drop file upload, theme browsing, and live inline PDF preview:

```bash
npm run ui
```

Opens `http://localhost:3131` automatically.

Features:

- Drag-and-drop or click to upload any source code file
- Search 50+ themes in the sidebar, import custom VSCode `.json` themes
- Font size, line height, indent, line numbers, word wrap, indent guides — all configurable
- **Live PDF preview** — any parameter change auto-regenerates the PDF and displays it inline on the right
- **VSCode-style indent guides** — continuous vertical lines carried through blank lines, consistent between preview and PDF
- Page size / orientation / content scaling — what you see is what you get
- **3 preset slots** — save and load favorite setting combinations (persisted to localStorage)
- Light / dark UI theme toggle

---

## Tech Stack

| Component | Role |
|---|---|
| [shiki](https://shiki.style) | Same syntax highlighting engine as VSCode |
| [puppeteer](https://pptr.dev) | Headless Chromium for PDF rendering |
| [commander](https://github.com/tj/commander.js) | CLI argument parsing |

---

## Development

```bash
git clone https://github.com/DrMaomao12345/code2pdf
cd code2pdf
npm install

# CLI
node bin/code2pdf.js src/index.js --line-numbers

# Web UI
npm run ui
```

---

## License

MIT License
