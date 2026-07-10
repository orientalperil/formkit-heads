import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [vue(), dts({ tsconfigPath: './tsconfig.json', include: ['src'] })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      // Don't bundle these — consumers provide them
      external: ['vue', 'vuetify', 'vuetify/components', '@formkit/core'],
    },
  },
})
