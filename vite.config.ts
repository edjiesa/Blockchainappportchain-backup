import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // React dan Tailwind tetap dipertahankan sesuai kebutuhan sistem
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ diarahkan ke folder src untuk kemudahan import
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Mendukung import file mentah (raw) seperti SVG dan CSV
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Konfigurasi server agar tetap kompatibel dengan Docker/Windows
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: true,
  },

  // Optimasi Build: Memisahkan node_modules menjadi chunk 'vendor'
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
