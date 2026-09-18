// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://34.shikosai.net',
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // トップページの 3D ヒーロー（three.js + React Three Fiber）は 1 チャンクで約 1MB になるため、
      // 既定の 500kB 警告を抑える。client:only で遅延読み込みされ、他ページには影響しない。
      chunkSizeWarningLimit: 1200
    }
  }
});