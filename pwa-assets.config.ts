import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Optional: `npm run icons` regenerates every PNG icon from public/icon.svg.
// The generated PNGs are already committed, so this is only needed if you change the SVG.
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/icon.svg'],
})
