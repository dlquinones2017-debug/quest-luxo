import { rolexRegistry } from "../../data/rolex";

export const rolexCollectionRoutes = Object.fromEntries(
  rolexRegistry.map((collection) => [
    collection.name,
    `/collections/rolex/${collection.slug}`,
  ])
);

export function getRolexCollectionRoute(model: string): string {
  return rolexCollectionRoutes[model] ?? "/collections/rolex";
}

export function getRolexReferenceRoute(model: string, reference: string): string {
  return `${getRolexCollectionRoute(model)}/${reference.toLowerCase()}`;
}

export function getRolexReferencePath(model: string, reference: string): string {
  return getRolexReferenceRoute(model, reference);
}
