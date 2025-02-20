import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
    }),
    vuetify({
      autoImport: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: "auto",
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Yugcontract TMS' + (process.env.NODE_ENV === 'production' ? '' : ' DEV'),
        short_name: 'TMS' + (process.env.NODE_ENV === 'production' ? '' : ' DEV'),
        description: 'Yugcontract TMS - Transport Management System',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/img/icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/img/icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(woff2?|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-fonts',
              expiration: {
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 рік кешування
              },
            },
          },          
        ],
      },
    }),
  ],
  define: {
    'process.env': {
      __VERSION__: JSON.stringify(require('./package.json').version),
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3011,
    watch: { usePolling: true }
  },
})
