const normalizeSegment = (value: string) =>
  encodeURIComponent(value.trim().toLowerCase());

export const collectionPath = (brandSlug: string, collectionSlug: string) =>
  `/collections/${normalizeSegment(brandSlug)}/${normalizeSegment(collectionSlug)}`;

export const referencePath = (
  brandSlug: string,
  collectionSlug: string,
  reference: string
) => `${collectionPath(brandSlug, collectionSlug)}/${normalizeSegment(reference)}`;

export const brandPath = (brandSlug: string) =>
  `/collections/${normalizeSegment(brandSlug)}`;

export const referenceRouteParam = (reference: string) =>
  normalizeSegment(reference);
