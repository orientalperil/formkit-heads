import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.json', include: ['src'] }),
    {
      // Ship the hand-written CSS overrides as-is. Nothing imports them, so the
      // lib build won't emit them otherwise — copy the file into dist verbatim.
      name: 'copy-vuetify-overrides-css',
      writeBundle() {
        mkdirSync(resolve(__dirname, 'dist/vuetify'), { recursive: true })
        copyFileSync(
          resolve(__dirname, 'src/vuetify/vuetify-formkit-overrides.css'),
          resolve(__dirname, 'dist/vuetify/vuetify-formkit-overrides.css'),
        )
      },
    },
  ],
  build: {
    lib: {
      // Entry key becomes the output file path (dist/vuetify/index.js),
      // which the package.json "exports" map points at.
      entry: {
        'index': resolve(__dirname, 'src/index.ts'),
        'vuetify/index': resolve(__dirname, 'src/vuetify/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Don't bundle these — consumers provide them
      external: ['vue', 'vuetify', 'vuetify/components', '@formkit/core', '@formkit/inputs'],
    },
  },
})
