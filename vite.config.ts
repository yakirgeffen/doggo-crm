import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
})
