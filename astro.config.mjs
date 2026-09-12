// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  adapter: node({
    mode: "standalone",
  }),
  site:
    process.env.SITE_URL ??
    "https://quest-luxo-production.onrender.com",
  redirects: {
    "/private-sourcing": "/contact",
    "/services": "/#services",
    "/market-insights": "/#collections",
  },
});
