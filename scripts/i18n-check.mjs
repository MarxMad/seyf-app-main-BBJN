#!/usr/bin/env node
/**
 * scripts/i18n-check.mjs
 *
 * Fails CI when the two message files have different key sets.
 * Run: node scripts/i18n-check.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadJson(relPath) {
  const abs = path.join(root, relPath)
  return JSON.parse(readFileSync(abs, 'utf8'))
}

/**
 * Recursively collect all dot-joined leaf key paths from an object.
 * @param {Record<string, unknown>} obj
 * @param {string} prefix
 * @returns {Set<string>}
 */
function leafPaths(obj, prefix = '') {
  const result = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      for (const sub of leafPaths(/** @type {Record<string, unknown>} */ (v), path)) {
        result.add(sub)
      }
    } else {
      result.add(path)
    }
  }
  return result
}

const esMX = loadJson('messages/es-MX.json')
const enUS = loadJson('messages/en-US.json')

const esPaths = leafPaths(esMX)
const enPaths = leafPaths(enUS)

const missingInEn = [...esPaths].filter((k) => !enPaths.has(k))
const missingInEs = [...enPaths].filter((k) => !esPaths.has(k))

let hasError = false

if (missingInEn.length > 0) {
  console.error(`\n❌  ${missingInEn.length} key(s) present in es-MX.json but MISSING in en-US.json:\n`)
  for (const k of missingInEn) console.error(`  - ${k}`)
  hasError = true
}

if (missingInEs.length > 0) {
  console.error(`\n❌  ${missingInEs.length} key(s) present in en-US.json but MISSING in es-MX.json:\n`)
  for (const k of missingInEs) console.error(`  - ${k}`)
  hasError = true
}

if (hasError) {
  console.error('\n⛔  i18n key parity check FAILED. Fix the issues above.\n')
  process.exit(1)
} else {
  console.log(`✅  i18n key parity OK — ${esPaths.size} keys in both es-MX and en-US.`)
  process.exit(0)
}
