import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
// Raíz del proyecto (seyf-app). Evita que Turbopack/Webpack infieran
// `...\Documents\GitHub` cuando hay otro lockfile en el padre o mezcla pnpm+npm.
const __dirname = path.resolve(path.dirname(__filename))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: __dirname,
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
