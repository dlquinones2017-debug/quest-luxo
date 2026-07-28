import type { APIRoute } from "astro";
import { brands } from "../data/brands";
import { collectionRegistry } from "../data/collectionRegistry";
import {
  brandPath,
  collectionPath,
  referencePath,
} from "../lib/routes/collectionRoutes";

export const prerender = true;

const staticPaths = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/transaction-standards",
];

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("https://quest-luxo-production.onrender.com");
  const paths = new Set(staticPaths);

  for (const brand of brands) paths.add(brandPath(brand.slug));
  for (const collection of collectionRegistry) {
    paths.add(collectionPath(collection.brandSlug, collection.slug));
    for (const asset of collection.assets) {
      paths.add(
        referencePath(
          collection.brandSlug,
          collection.slug,
          asset.reference
        )
      );
    }
  }

  const urls = [...paths]
    .sort()
    .map(
      (path) =>
        `  <url><loc>${escapeXml(new URL(path, origin).href)}</loc></url>`
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${urls}\n</urlset>\n`,
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "application/xml; charset=utf-8",
      },
    }
  );
};
