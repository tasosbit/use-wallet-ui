import { cpSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const base = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf-8'))
const chrome = JSON.parse(readFileSync(resolve(root, 'manifest.chrome.json'), 'utf-8'))
const firefox = JSON.parse(readFileSync(resolve(root, 'manifest.firefox.json'), 'utf-8'))

// Copy build artifacts to browser-specific directories and remove intermediate dist/
cpSync(resolve(root, 'dist'), resolve(root, 'dist-chrome'), { recursive: true })
cpSync(resolve(root, 'dist'), resolve(root, 'dist-firefox'), { recursive: true })
rmSync(resolve(root, 'dist'), { recursive: true })

// Write Chrome manifest
writeFileSync(
  resolve(root, 'dist-chrome/manifest.json'),
  JSON.stringify({ ...base, ...chrome }, null, 2),
)

// Write Firefox manifest
writeFileSync(
  resolve(root, 'dist-firefox/manifest.json'),
  JSON.stringify({ ...base, ...firefox }, null, 2),
)

console.log('Built extension for Chrome (dist-chrome/) and Firefox (dist-firefox/)')
