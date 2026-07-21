import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Ini untuk mengaktifkan Tailwind CSS
    VitePWA({      // Ini untuk mengaktifkan fitur Install di HP (PWA)
      registerType: 'autoUpdate',
      manifest: {
        name: 'Keuangan Rumah',
        short_name: 'Keuangan',
        description: 'Aplikasi pencatatan keuangan pembangunan rumah',
        theme_color: '#1d4ed8',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})