// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Kiwi Maru',
      cssVariable: '--font-primary',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin', 'japanese']
    }
  ]
});