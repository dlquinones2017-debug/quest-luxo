import type { APIRoute } from "astro";

export const prerender = false;

// Published codes are permanent. Append new entries without reassigning a code.
const placements = new Map<string, string>([
  ["01", "founder_6adc2e0429f86b7b3e696e35"],
  ["02", "founder_6adc2e0429f86b7b3e696e4c"],
  ["03", "founder_6adc2e0429f86b7b3e696e63"],
  ["04", "founder_6adc2e0429f86b7b3e696e7a"],
  ["05", "founder_6adc2e0529f86b7b3e696e91"],
  ["06", "business_6adc2ef6d81adce1baf942b6"],
  ["07", "founder_6adf08eaf821a66b2947a141"],
  ["08", "founder_6adf08eaf821a66b2947a158"],
  ["09", "founder_6adf08eaf821a66b2947a16f"],
  ["0a", "founder_6adf08eaf821a66b2947a186"],
  ["0b", "founder_6adf08eaf821a66b2947a19d"],
  ["0c", "founder_6adf08eaf821a66b2947a1b4"],
  ["0d", "business_6ae8c9610c725a1b196924f8"],
  ["0e", "business_6ae8c9bc91cc26f0b212496c"],
  ["0f", "business_6ae8ca5d9850239661cc6138"],
  ["0g", "business_6ae8cbb0a5f29ac4b58ff933"],
  ["0h", "business_6ae8ce3b036f49f8f190145a"],
  ["0i", "founder_showcase_6afc3a4922b209c53d015abf"],
  ["0j", "founder_showcase_6afc3a4922b209c53d015aed"],
  ["0k", "founder_showcase_6afc3a4a22b209c53d015b11"],
  ["0l", "founder_showcase_6afc3a4a22b209c53d015b32"],
  ["0m", "founder_showcase_6afc3a4a22b209c53d015b5e"],
  ["0n", "founder_showcase_6afc3a4a22b209c53d015b8c"],
  ["0o", "founder_showcase_6afc3a4a22b209c53d015ba5"],
  ["0p", "founder_showcase_6afc3a4a22b209c53d015bd1"],
  ["0q", "founder_showcase_6afc3a4b22b209c53d015bff"],
  ["0r", "founder_showcase_6afc3a4b22b209c53d015c18"],
  ["0s", "founder_showcase_6afc3a4b22b209c53d015c46"],
  ["0t", "founder_showcase_6afc3a4b22b209c53d015c74"],
  ["0u", "founder_showcase_6afc3a4c22b209c53d015ca2"],
  ["0v", "founder_showcase_6afc3a4c22b209c53d015cd0"],
  ["0w", "founder_showcase_6afc3a4c22b209c53d015cf9"],
  ["0x", "founder_showcase_6afc3a4c22b209c53d015d10"],
  ["0y", "founder_showcase_6afc3a4c22b209c53d015d27"],
  ["0z", "founder_showcase_6afc3a4d22b209c53d015d3e"],
  ["10", "founder_showcase_6afc3a4d22b209c53d015d55"],
  ["11", "founder_showcase_6afc43ba173291239fb6361d"],
  ["12", "founder_showcase_6afc43ba173291239fb63634"],
  ["13", "founder_showcase_6afc43ba173291239fb6364b"],
  ["14", "founder_showcase_6afc43ba173291239fb63662"],
  ["15", "founder_showcase_6afc43ba173291239fb63679"],
  ["16", "founder_showcase_6afc43bb173291239fb63690"],
  ["17", "founder_showcase_6afc43bb173291239fb636a7"],
  ["18", "founder_showcase_6afc43bb173291239fb636be"],
  ["19", "founder_showcase_6afc43bb173291239fb636d5"],
  ["1a", "founder_showcase_6afc43bb173291239fb636ec"],
  ["1b", "founder_showcase_6afc43bb173291239fb63703"],
  ["1c", "founder_showcase_6afc43bc173291239fb6371a"],
  ["1d", "founder_showcase_6afc43bc173291239fb63731"],
  ["1e", "founder_showcase_6afc43bc173291239fb63748"],
  ["1f", "founder_showcase_6afcb456408b675521accffc"],
  ["1g", "founder_showcase_6afcb540e5d9c9dd8ebcc3b9"],
  ["1h", "founder_showcase_6afcdba6183d51d92220fb9d"],
  ["1i", "founder_showcase_6afcdba7183d51d92220fbb4"],
  ["1j", "founder_showcase_6afcdba7183d51d92220fbcb"],
  ["1k", "founder_showcase_6afcdba7183d51d92220fbe2"],
  ["1l", "founder_showcase_6afcdba7183d51d92220fbf9"],
  ["1m", "founder_showcase_6afcdba7183d51d92220fc10"],
  ["1n", "founder_showcase_6afcdba7183d51d92220fc27"],
  ["1o", "founder_showcase_6afcdba8183d51d92220fc3e"],
  ["1p", "founder_showcase_6afcdba8183d51d92220fc55"],
  ["1q", "founder_showcase_6afcdba8183d51d92220fc6c"],
  ["un", "marine_torpilleur_1183_310_40_founder"],
]);

export const GET: APIRoute = ({ params }) => {
  const code = params.code ?? "";
  const query = new URLSearchParams({ intent: "request-this-watch" });
  if (code !== "go") {
    const placement = placements.get(code);
    if (!placement) return new Response(null, { status: 404 });
    query.set("utm_source", "linkedin");
    query.set("utm_medium", "organic_social");
    query.set("utm_campaign", "luxury_advisory");
    query.set("utm_content", placement);
  }
  return new Response(null, {
    status: 302,
    headers: { Location: `/begin-your-quest/?${query}`, "Cache-Control": "no-store" },
  });
};
