import type { QuestLuxoAsset } from "../../types/questLuxo";
import {
  askQuestLuxo,
  type AskQuestLuxoAnswer,
  type AskQuestLuxoInput,
} from "./askQuestLuxo";

export const askQuestLuxoStandardTestQueries = Object.freeze([
  "watches under $25000",
  "Rolex under $15000",
  "best investment watches",
  "blue dial Rolex",
  "daily watch",
  "sports watch",
] as const);

export type AskQuestLuxoStandardTestQuery =
  (typeof askQuestLuxoStandardTestQueries)[number];

export interface AskQuestLuxoTestHarnessOptions<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> extends Omit<AskQuestLuxoInput<TAsset>, "query"> {
  readonly queries?: readonly string[];
  readonly weakResultThreshold?: number;
}

export interface AskQuestLuxoTestSummary {
  readonly query: string;
  readonly totalMatches: number;
  readonly recommendationCount: number;
  readonly topReference: string | null;
  readonly topModel: string | null;
  readonly topOverallScore: number | null;
  readonly topRelevanceScore: number | null;
  readonly isEmpty: boolean;
  readonly isWeak: boolean;
  readonly summary: string;
}

export interface AskQuestLuxoTestResult<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly query: string;
  readonly answer: AskQuestLuxoAnswer<TAsset>;
  readonly testSummary: AskQuestLuxoTestSummary;
}

const defaultWeakResultThreshold = 60;

export function summarizeAskQuestLuxoTestResult<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  answer: AskQuestLuxoAnswer<TAsset>,
  weakResultThreshold = defaultWeakResultThreshold
): AskQuestLuxoTestSummary {
  const topRecommendation = answer.recommendations[0];
  const topOverallScore = topRecommendation?.scores.overallScore ?? null;
  const topRelevanceScore = topRecommendation?.scores.relevanceScore ?? null;
  const isEmpty = answer.recommendations.length === 0;
  const isWeak =
    isEmpty ||
    topOverallScore === null ||
    topRelevanceScore === null ||
    Math.min(topOverallScore, topRelevanceScore) < weakResultThreshold;

  return Object.freeze({
    query: answer.query,
    totalMatches: answer.totalMatches,
    recommendationCount: answer.recommendations.length,
    topReference: topRecommendation?.reference ?? null,
    topModel: topRecommendation?.model ?? null,
    topOverallScore,
    topRelevanceScore,
    isEmpty,
    isWeak,
    summary: answer.summary,
  });
}

export function runAskQuestLuxoTestQuery<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  query: string,
  options: AskQuestLuxoTestHarnessOptions<TAsset> = {}
): AskQuestLuxoTestResult<TAsset> {
  const answer = askQuestLuxo({
    ...options,
    query,
  });

  return Object.freeze({
    query,
    answer,
    testSummary: summarizeAskQuestLuxoTestResult(
      answer,
      options.weakResultThreshold
    ),
  });
}

export function runAskQuestLuxoTestHarness<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  options: AskQuestLuxoTestHarnessOptions<TAsset> = {}
): readonly AskQuestLuxoTestResult<TAsset>[] {
  const queries = options.queries ?? askQuestLuxoStandardTestQueries;

  return Object.freeze(
    queries.map((query) => runAskQuestLuxoTestQuery(query, options))
  );
}

export function getAskQuestLuxoTestSummaries<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  options: AskQuestLuxoTestHarnessOptions<TAsset> = {}
): readonly AskQuestLuxoTestSummary[] {
  return Object.freeze(
    runAskQuestLuxoTestHarness(options).map((result) => result.testSummary)
  );
}

export function getEmptyAskQuestLuxoTestResults<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  results: readonly AskQuestLuxoTestResult<TAsset>[]
): readonly AskQuestLuxoTestResult<TAsset>[] {
  return Object.freeze(
    results.filter((result) => result.testSummary.isEmpty)
  );
}

export function getWeakAskQuestLuxoTestResults<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  results: readonly AskQuestLuxoTestResult<TAsset>[]
): readonly AskQuestLuxoTestResult<TAsset>[] {
  return Object.freeze(results.filter((result) => result.testSummary.isWeak));
}
