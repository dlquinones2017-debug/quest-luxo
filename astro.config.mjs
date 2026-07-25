// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site:
    process.env.SITE_URL ??
    "https://quest-luxo-production.onrender.com",
  redirects: {
    "/private-sourcing": "/contact",
    "/services": "/#services",
    "/market-insights": "/#collections",
  },
});
