import type { BrokerageEconomicsSnapshot } from "./brokerageEconomicsSnapshot.ts";
import {
  isServiceExposureClassification,
  type ServiceExposureClassification,
} from "./brokerageEconomicsRisk.ts";

export const leadEconomicsSummaryStateValues = [
  "not-analyzed",
  "legacy-analysis",
  "protected",
  "exposed",
  "fragile",
  "unprofitable",
  "incomplete",
] as const;

export type LeadEconomicsSummaryState =
  | "not-analyzed"
  | "legacy-analysis"
  | ServiceExposureClassification;

export const leadEconomicsFilterValues = [
  "all",
  ...leadEconomicsSummaryStateValues,
  "model-caution",
] as const;

export type LeadEconomicsFilter =
  (typeof leadEconomicsFilterValues)[number];

export const leadEconomicsSortValues = [
  "current",
  "needs-analysis-first",
  "highest-base-profit",
  "lowest-base-profit",
  "highest-roi",
  "lowest-roi",
  "most-recently-analyzed",
  "least-recently-analyzed",
] as const;

export type LeadEconomicsSort = (typeof leadEconomicsSortValues)[number];

export interface LeadEconomicsSnapshotSource {
  readonly economicsSnapshots?: unknown;
}

export interface LeadEconomicsQueueRecord extends LeadEconomicsSnapshotSource {
  readonly id?: unknown;
  readonly status?: unknown;
  readonly notes?: unknown;
  readonly tags?: unknown;
  readonly payload?: unknown;
}

export interface LeadEconomicsSummary {
  readonly hasSnapshots: boolean;
  readonly latestSnapshot: Readonly<Partial<BrokerageEconomicsSnapshot>> | null;
  readonly snapshotTimestamp: string | null;
  readonly snapshotTimestampMs: number | null;
  readonly baseExpectedProfit: number | null;
  readonly roiPercent: number | null;
  readonly serviceExposureClassification: ServiceExposureClassification | null;
  readonly modelCaution: boolean;
  readonly modelCautionLabel: string | null;
  readonly usesCurrentRiskAnalysis: boolean;
  readonly state: LeadEconomicsSummaryState;
}

export interface EconomicsCoverageCounts {
  readonly total: number;
  readonly currentRiskGuidance: number;
  readonly notAnalyzed: number;
  readonly legacyAnalysis: number;
  readonly protected: number;
  readonly exposed: number;
  readonly fragile: number;
  readonly unprofitable: number;
  readonly modelCautions: number;
}

export interface LeadEconomicsQueueViewOptions {
  readonly statusFilter?: string | null;
  readonly searchQuery?: string | null;
  readonly economicsFilter?: LeadEconomicsFilter;
  readonly economicsSort?: LeadEconomicsSort;
}

const needsAnalysisRank: Readonly<Record<LeadEconomicsSummaryState, number>> =
  Object.freeze({
    "not-analyzed": 0,
    "legacy-analysis": 1,
    incomplete: 2,
    protected: 3,
    exposed: 3,
    fragile: 3,
    unprofitable: 3,
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const getNormalizedText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const getValidTimestamp = (
  value: unknown
): { readonly timestamp: string | null; readonly time: number | null } => {
  const timestamp = getNormalizedText(value);
  const time = timestamp ? Date.parse(timestamp) : Number.NaN;

  return Number.isFinite(time)
    ? { timestamp, time }
    : { timestamp: null, time: null };
};

const getLatestSnapshot = (
  snapshots: readonly unknown[]
): {
  readonly snapshot: Readonly<Partial<BrokerageEconomicsSnapshot>> | null;
  readonly timestamp: string | null;
  readonly time: number | null;
} => {
  const candidates = snapshots.flatMap((value, index) => {
    if (!isRecord(value)) return [];

    const timestamp = getValidTimestamp(value.createdAt);

    return [{ value, index, ...timestamp }];
  });

  if (candidates.length === 0) {
    return { snapshot: null, timestamp: null, time: null };
  }

  const latest = candidates.reduce((current, candidate) => {
    if (candidate.time !== null && current.time === null) return candidate;
    if (candidate.time === null && current.time !== null) return current;

    if (
      candidate.time !== null &&
      current.time !== null &&
      candidate.time !== current.time
    ) {
      return candidate.time > current.time ? candidate : current;
    }

    return candidate.index > current.index ? candidate : current;
  });

  return {
    snapshot: latest.value as Readonly<Partial<BrokerageEconomicsSnapshot>>,
    timestamp: latest.timestamp,
    time: latest.time,
  };
};

const getCurrentRiskAnalysis = (
  snapshot: Readonly<Partial<BrokerageEconomicsSnapshot>> | null
): Record<string, unknown> | null => {
  if (!snapshot || !isRecord(snapshot.riskAnalysis)) return null;

  const classification = snapshot.riskAnalysis.serviceExposureClassification;

  if (
    !isServiceExposureClassification(classification) ||
    typeof snapshot.riskAnalysis.modelCaution !== "boolean"
  ) {
    return null;
  }

  return snapshot.riskAnalysis;
};

const getModelCautionLabel = (
  riskAnalysis: Record<string, unknown> | null
): string | null => {
  if (!riskAnalysis || !isRecord(riskAnalysis.thinMarginModel)) return null;

  return getNormalizedText(riskAnalysis.thinMarginModel.label) || null;
};

export function deriveLatestLeadEconomicsSummary(
  lead: LeadEconomicsSnapshotSource | null | undefined
): LeadEconomicsSummary {
  const snapshots = Array.isArray(lead?.economicsSnapshots)
    ? lead.economicsSnapshots
    : [];
  const hasSnapshots = snapshots.length > 0;

  if (!hasSnapshots) {
    return Object.freeze({
      hasSnapshots: false,
      latestSnapshot: null,
      snapshotTimestamp: null,
      snapshotTimestampMs: null,
      baseExpectedProfit: null,
      roiPercent: null,
      serviceExposureClassification: null,
      modelCaution: false,
      modelCautionLabel: null,
      usesCurrentRiskAnalysis: false,
      state: "not-analyzed",
    });
  }

  const latest = getLatestSnapshot(snapshots);
  const riskAnalysis = getCurrentRiskAnalysis(latest.snapshot);
  const usesCurrentRiskAnalysis = riskAnalysis !== null;
  const serviceExposureClassification = usesCurrentRiskAnalysis
    ? (riskAnalysis.serviceExposureClassification as ServiceExposureClassification)
    : null;
  const baseExpectedProfit = usesCurrentRiskAnalysis
    ? getFiniteNumber(riskAnalysis.baseExpectedProfit)
    : getFiniteNumber(latest.snapshot?.netProfit);
  const roiPercent = getFiniteNumber(latest.snapshot?.roiPercent);
  const modelCaution =
    usesCurrentRiskAnalysis && riskAnalysis.modelCaution === true;
  let state: LeadEconomicsSummaryState = "legacy-analysis";

  if (usesCurrentRiskAnalysis) {
    state =
      serviceExposureClassification === "incomplete" ||
      baseExpectedProfit === null ||
      roiPercent === null
        ? "incomplete"
        : serviceExposureClassification ?? "incomplete";
  }

  return Object.freeze({
    hasSnapshots,
    latestSnapshot: latest.snapshot,
    snapshotTimestamp: latest.timestamp,
    snapshotTimestampMs: latest.time,
    baseExpectedProfit,
    roiPercent,
    serviceExposureClassification,
    modelCaution,
    modelCautionLabel: modelCaution
      ? getModelCautionLabel(riskAnalysis)
      : null,
    usesCurrentRiskAnalysis,
    state,
  });
}

export function isLeadEconomicsFilter(
  value: unknown
): value is LeadEconomicsFilter {
  return (
    typeof value === "string" &&
    leadEconomicsFilterValues.includes(value as LeadEconomicsFilter)
  );
}

export function isLeadEconomicsSort(value: unknown): value is LeadEconomicsSort {
  return (
    typeof value === "string" &&
    leadEconomicsSortValues.includes(value as LeadEconomicsSort)
  );
}

export function matchesLeadEconomicsFilter(
  lead: LeadEconomicsSnapshotSource,
  filter: LeadEconomicsFilter
): boolean {
  if (filter === "all") return true;

  const summary = deriveLatestLeadEconomicsSummary(lead);

  return filter === "model-caution"
    ? summary.modelCaution
    : summary.state === filter;
}

export function createEconomicsCoverageCounts(
  leads: readonly LeadEconomicsSnapshotSource[]
): EconomicsCoverageCounts {
  const counts = {
    total: leads.length,
    currentRiskGuidance: 0,
    notAnalyzed: 0,
    legacyAnalysis: 0,
    protected: 0,
    exposed: 0,
    fragile: 0,
    unprofitable: 0,
    modelCautions: 0,
  };

  leads.forEach((lead) => {
    const summary = deriveLatestLeadEconomicsSummary(lead);

    if (summary.usesCurrentRiskAnalysis) counts.currentRiskGuidance += 1;
    if (summary.modelCaution) counts.modelCautions += 1;

    switch (summary.state) {
      case "not-analyzed":
        counts.notAnalyzed += 1;
        break;
      case "legacy-analysis":
        counts.legacyAnalysis += 1;
        break;
      case "protected":
        counts.protected += 1;
        break;
      case "exposed":
        counts.exposed += 1;
        break;
      case "fragile":
        counts.fragile += 1;
        break;
      case "unprofitable":
        counts.unprofitable += 1;
        break;
      case "incomplete":
        break;
    }
  });

  return Object.freeze(counts);
}

const compareOptionalNumbers = (
  first: number | null,
  second: number | null,
  direction: "ascending" | "descending"
): number => {
  if (first === null && second === null) return 0;
  if (first === null) return 1;
  if (second === null) return -1;

  return direction === "ascending" ? first - second : second - first;
};

export function sortLeadsByEconomics<T extends LeadEconomicsSnapshotSource>(
  leads: readonly T[],
  sort: LeadEconomicsSort
): T[] {
  if (sort === "current") return [...leads];

  const decorated = leads.map((lead, index) => ({
    lead,
    index,
    summary: deriveLatestLeadEconomicsSummary(lead),
  }));

  decorated.sort((first, second) => {
    let comparison = 0;

    switch (sort) {
      case "needs-analysis-first":
        comparison =
          needsAnalysisRank[first.summary.state] -
          needsAnalysisRank[second.summary.state];
        break;
      case "highest-base-profit":
        comparison = compareOptionalNumbers(
          first.summary.baseExpectedProfit,
          second.summary.baseExpectedProfit,
          "descending"
        );
        break;
      case "lowest-base-profit":
        comparison = compareOptionalNumbers(
          first.summary.baseExpectedProfit,
          second.summary.baseExpectedProfit,
          "ascending"
        );
        break;
      case "highest-roi":
        comparison = compareOptionalNumbers(
          first.summary.roiPercent,
          second.summary.roiPercent,
          "descending"
        );
        break;
      case "lowest-roi":
        comparison = compareOptionalNumbers(
          first.summary.roiPercent,
          second.summary.roiPercent,
          "ascending"
        );
        break;
      case "most-recently-analyzed":
        comparison = compareOptionalNumbers(
          first.summary.snapshotTimestampMs,
          second.summary.snapshotTimestampMs,
          "descending"
        );
        break;
      case "least-recently-analyzed":
        comparison = compareOptionalNumbers(
          first.summary.snapshotTimestampMs,
          second.summary.snapshotTimestampMs,
          "ascending"
        );
        break;
    }

    return comparison || first.index - second.index;
  });

  return decorated.map(({ lead }) => lead);
}

const getQueueSearchText = (lead: LeadEconomicsQueueRecord): string => {
  const payload = isRecord(lead.payload) ? lead.payload : {};
  const tags = Array.isArray(lead.tags) ? lead.tags : [];

  return [
    payload.name,
    payload.email,
    payload.phone,
    payload.brand,
    payload.collection,
    payload.reference,
    payload.desiredWatch,
    payload.message,
    lead.notes,
    ...tags,
  ]
    .map(getNormalizedText)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const getQueueStatus = (lead: LeadEconomicsQueueRecord): string =>
  getNormalizedText(lead.status) || "new";

export function createLeadEconomicsQueueView<
  T extends LeadEconomicsQueueRecord,
>(
  leads: readonly T[],
  options: LeadEconomicsQueueViewOptions = {}
): T[] {
  const statusFilter = getNormalizedText(options.statusFilter) || "all";
  const searchQuery = getNormalizedText(options.searchQuery).toLowerCase();
  const economicsFilter = options.economicsFilter ?? "all";
  const economicsSort = options.economicsSort ?? "current";
  const filtered = leads.filter((lead) => {
    const statusMatches =
      statusFilter === "all" || getQueueStatus(lead) === statusFilter;
    const searchMatches =
      !searchQuery || getQueueSearchText(lead).includes(searchQuery);

    return (
      statusMatches &&
      searchMatches &&
      matchesLeadEconomicsFilter(lead, economicsFilter)
    );
  });

  return sortLeadsByEconomics(filtered, economicsSort);
}

export function replaceLeadEconomicsQueueRecord<
  T extends LeadEconomicsQueueRecord,
>(leads: readonly T[], updatedLead: T): T[] {
  const updatedId = getNormalizedText(updatedLead.id);

  if (!updatedId) return [...leads];

  return leads.map((lead) =>
    getNormalizedText(lead.id) === updatedId ? updatedLead : lead
  );
}
