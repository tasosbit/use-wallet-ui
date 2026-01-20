#!/usr/bin/env node
/**
 * Post-processes the generated Tailwind CSS file to ensure utility classes
 * are scoped to wallet UI components.
 *
 * This script adds [data-wallet-ui] scoping to CSS class selectors. It generates
 * two selector patterns for each utility class:
 *
 * 1. [data-wallet-ui].class - for elements that have the attribute directly (buttons)
 * 2. [data-wallet-ui] .class - for descendants of elements with the attribute (portal content)
 *
 * This approach allows:
 * - Buttons with data-wallet-ui to receive utility classes directly
 * - Portal wrappers with data-wallet-ui to scope utility classes to their children
 * - No utility class leakage to consumer app elements
 *
 * With CSS @layer, consumer CSS (unlayered) automatically beats the layered
 * library CSS, enabling easy customization without !important.
 */

import fs from 'fs/promises'
import path from 'path'

const STYLE_FILE_PATH = path.resolve('./dist/style.css')

// Check if a line contains a top-level class selector
function isTopLevelClassSelector(line) {
  const trimmed = line.trim()
  // Skip existing prefixed lines, theme selectors, at-rules, and comments
  if (
    line.includes('[data-wallet-ui]') ||
    line.includes('[data-wallet-theme]') ||
    trimmed.startsWith('@') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*')
  ) {
    return false
  }
  // Match a line that starts with a period followed by valid CSS class characters
  return /^\s*\.[a-zA-Z0-9_\-\\:]+[^\{]*\{/.test(line)
}

async function main() {
  try {
    // Read the generated CSS file
    const cssContent = await fs.readFile(STYLE_FILE_PATH, 'utf8')
    const lines = cssContent.split('\n')

    // Process each line
    const processedLines = lines.map((line) => {
      if (isTopLevelClassSelector(line)) {
        // Extract the leading whitespace and the selector
        const match = line.match(/^(\s*)(\.[^\{]+)\{(.*)$/)
        if (match) {
          const [, indent, selector, rest] = match
          // Trim the selector to remove trailing spaces before the opening brace
          const trimmedSelector = selector.trim()
          // Generate both patterns:
          // 1. [data-wallet-ui].class - element has attribute directly
          // 2. [data-wallet-ui] .class - element is descendant
          return `${indent}[data-wallet-ui]${trimmedSelector}, [data-wallet-ui] ${trimmedSelector} {${rest}`
        }
        // Fallback to original behavior if regex doesn't match
        return line.replace(/(\s*)\./, '$1[data-wallet-ui] .')
      }
      return line
    })

    // Write the processed content back to the file
    await fs.writeFile(STYLE_FILE_PATH, processedLines.join('\n'))

    console.log(
      `Processed CSS file to add [data-wallet-ui] prefix to class selectors in ${STYLE_FILE_PATH}`,
    )
  } catch (error) {
    console.error('Error processing CSS file:', error)
    process.exit(1)
  }
}

main()
