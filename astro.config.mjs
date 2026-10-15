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
    "/complications/tourbillon": { destination: "/#collections", status: 301 },
    "/collections/franck-muller/vanguard-tourbillon": { destination: "/collections/franck-muller/vanguard", status: 301 },
    "/collections/franck-muller/vanguard-tourbillon/v-45-t-br-tt": { destination: "/collections/franck-muller/vanguard/v-45-t-br-tt", status: 301 },
    "/private-sourcing": "/contact",
    "/services": "/#services",
    "/market-insights": "/#collections",
  },
});
