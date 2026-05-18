import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Replaces `%VITE_*%` placeholders in index.html with values from .env / Vercel
// env at build time. Vite's built-in HTML interpolation only substitutes
// `%MODE%` + `%BASE_URL%`; analytics IDs need an explicit hook.
// Authored 2026-05-17 by Neta (Data IC) — see analytics/README.md §Configuration.
function htmlEnvPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'html-env-substitution',
    transformIndexHtml(html) {
      return html.replace(/%(VITE_[A-Z0-9_]+)%/g, (_match, key: string) => {
        return env[key] ?? ''
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss(), htmlEnvPlugin(env)],
    build: {
      // Split vendor + lucide icons into separate chunks. Reduces the main
      // bundle from ~700KB to multiple smaller chunks; improves first-paint
      // on the public landing/blog/pricing pages where the trainer app code
      // isn't needed.
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase': ['@supabase/supabase-js'],
            'lucide': ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  }
})
