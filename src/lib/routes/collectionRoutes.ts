const normalizeSegment = (value: string) =>
  encodeURIComponent(value.trim().toLowerCase());

const normalizeReferenceSegment = (value: string) =>
  value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const collectionPath = (brandSlug: string, collectionSlug: string) =>
  `/collections/${normalizeSegment(brandSlug)}/${normalizeSegment(collectionSlug)}`;

export const referencePath = (
  brandSlug: string,
  collectionSlug: string,
  reference: string
) => `${collectionPath(brandSlug, collectionSlug)}/${normalizeReferenceSegment(reference)}`;

export const brandPath = (brandSlug: string) =>
  `/collections/${normalizeSegment(brandSlug)}`;

export const referenceRouteParam = (reference: string) =>
  normalizeReferenceSegment(reference);
