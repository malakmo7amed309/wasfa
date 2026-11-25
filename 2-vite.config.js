import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: '/wasfa/',
  plugins: [preact(), tailwindcss(), viteSingleFile()],
})
