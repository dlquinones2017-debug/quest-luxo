import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL("https://quest-luxo-production.onrender.com");
  const sitemap = new URL("/sitemap.xml", origin).href;

  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /operations",
      "Disallow: /api/",
      `Sitemap: ${sitemap}`,
      "",
    ].join("\n"),
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
};
