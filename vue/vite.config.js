// Plugins
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls },
      // reactivityTransform: true
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      // registerType: 'prompt',   
      injectRegister: "auto",
      //swSrc: './public/sw.js',
      // workbox: {
      //   sourcemap: true
      // },
      includeAssets: ['favicon.ico'],
      inlineManifest: {
        "permissions": [
          "geolocation"
        ]
      },
      manifest: {
        name: 'Yugcontract TMS',
        short_name: 'TMS',
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
