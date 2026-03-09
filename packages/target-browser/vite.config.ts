import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Plugin to handle .worker.ts imports like esbuild-plugin-inline-worker
// Transforms: import QrWorker from './qr.worker'
// Into Vite's native worker import syntax
function workerPlugin(): Plugin {
  return {
    name: 'worker-loader',
    enforce: 'pre',
    async resolveId(source, importer) {
      // Match imports like './qr.worker' (without .ts extension)
      if (source.endsWith('.worker') && importer) {
        return {
          id: `\0worker:${resolve(importer, '..', source + '.ts')}`,
          moduleSideEffects: false,
        }
      }
      return null
    },
    load(id) {
      if (id.startsWith('\0worker:')) {
        const workerPath = id.slice('\0worker:'.length)
        // Return a module that creates and exports the worker
        // Using Vite's ?worker&inline suffix for inline workers
        return `
          import Worker from '${workerPath}?worker&inline'
          export default Worker
        `
      }
      return null
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  root: resolve(__dirname, '../frontend'),
  publicDir: resolve(__dirname, '../../static'),
  plugins: [workerPlugin(), react()],
  define: {
    // Define process for browser compatibility (used by shared/logger.ts)
    'process.argv': JSON.stringify([]),
    'process.env': JSON.stringify({}),
  },
  resolve: {
    alias: {
      path: 'path-browserify',
      // Allow importing the browser runtime and entry from index.html
      '/runtime-browser': resolve(__dirname, 'runtime-browser'),
      '/vite-entry.ts': resolve(__dirname, 'vite-entry.ts'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        api: 'modern',
      },
    },
  },
  // Exclude build artifacts and help files from scanning
  build: {
    rollupOptions: {
      input: resolve(__dirname, '../frontend/index.html'),
    },
    outDir: resolve(__dirname, 'dist-vite'),
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: false,
      // Allow serving files from the entire monorepo
      allow: [resolve(__dirname, '../..')],
    },
    proxy: Object.fromEntries(
      [
        '/backend-api',
        '/blobs',
        '/locales',
        '/themes',
        '/help',
        '/help_exists',
        '/authenticate',
        '/logout',
        '/log',
        '/images',
      ].map(path => [
        path,
        {
          target: 'https://localhost:3000',
          changeOrigin: true,
          secure: false,
          // Strip Secure flag from cookies so they work over HTTP
          // (e.g. when accessed via VSCode port forwarding)
          configure: (proxy: { on: Function }) => {
            proxy.on('proxyRes', (proxyRes: { headers: Record<string, string | string[]> }) => {
              const sc = proxyRes.headers['set-cookie']
              if (sc) {
                const arr = Array.isArray(sc) ? sc : [sc]
                proxyRes.headers['set-cookie'] = arr.map(
                  (c: string) => c.replace(/;\s*Secure/gi, '')
                )
              }
            })
          },
        },
      ]).concat([
        ['/ws', {
          target: 'wss://localhost:3000',
          ws: true,
          secure: false,
        }],
      ]),
    ) as Record<string, any>,
  },
  // Only scan our entry points, not build artifacts
  optimizeDeps: {
    entries: ['./index.html'],
  },
})
