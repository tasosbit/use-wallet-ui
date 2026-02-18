import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const base = JSON.parse(readFileSync(resolve(root, 'manifest.json'), 'utf-8'))
const chrome = JSON.parse(readFileSync(resolve(root, 'manifest.chrome.json'), 'utf-8'))
const firefox = JSON.parse(readFileSync(resolve(root, 'manifest.firefox.json'), 'utf-8'))

// Default manifest.json in dist is Chrome
writeFileSync(
  resolve(root, 'dist/manifest.json'),
  JSON.stringify({ ...base, ...chrome }, null, 2),
)

// Firefox manifest as an alternative
writeFileSync(
  resolve(root, 'dist/manifest.firefox.json'),
  JSON.stringify({ ...base, ...firefox }, null, 2),
)

console.log('Built manifests for Chrome (dist/manifest.json) and Firefox (dist/manifest.firefox.json)')
