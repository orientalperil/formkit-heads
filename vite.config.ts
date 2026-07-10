import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json', include: ['src'] })],
  build: {
    lib: {
      // Entry key becomes the output file path (dist/vuetify/index.js),
      // which the package.json "exports" map points at.
      entry: {
        'vuetify/index': resolve(__dirname, 'src/vuetify/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Don't bundle these — consumers provide them
      external: ['vue', 'vuetify', 'vuetify/components', '@formkit/core'],
    },
  },
})
