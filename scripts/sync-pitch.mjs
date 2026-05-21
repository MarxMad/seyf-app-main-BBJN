#!/usr/bin/env node
/**
 * Copia pitch/ → public/pitch/ (Vercel y entornos sin rsync).
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const src = path.join(root, 'pitch')
const dest = path.join(root, 'public', 'pitch')

if (!fs.existsSync(src)) {
  console.error('sync-pitch: no existe la carpeta pitch/')
  process.exit(1)
}

fs.rmSync(dest, { recursive: true, force: true })
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.cpSync(src, dest, { recursive: true })
console.log('sync-pitch: pitch/ → public/pitch/')
