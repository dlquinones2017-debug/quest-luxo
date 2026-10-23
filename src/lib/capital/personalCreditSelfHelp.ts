/**
 * Quest Luxo Financial Advancement: self-directed personal credit education.
 *
 * Free educational navigation only. It does NOT read credit reports, issue
 * credit decisions, provide individualized repair advice, generate or submit
 * disputes, charge consumers, or retain identifying / financial information.
 * Legal review is required before marketing or launching any "credit repair"
 * feature, paid coaching, or third-party referral monetization.
 */
export type PersonalCreditSelfHelpStepId =
  | "OBTAIN_REPORTS"
  | "REVIEW_ACCURACY"
  | "CORRECT_REAL_ERRORS"
  | "BUILD_HEALTHY_HABITS"
  | "REASSESS_FUNDING_GOAL";

export interface PersonalCreditSelfHelpStep {
  id: PersonalCreditSelfHelpStepId;
  title: string;
  instructions: string;
  resourceLabel: string;
  resourceUrl: string;
  /** Work is entirely undertaken by the consumer outside Quest Luxo. */
  consumerActsIndependently: true;
}

export interface PersonalCreditSelfHelpProgram {
  title: string;
  description: string;
  priceUsd: 0;
  steps: readonly PersonalCreditSelfHelpStep[];
  noCreditPulls: true;
  noDisputeGenerationOrSubmission: true;
  noScoreOrFundingGuarantees: true;
  noPersonallyIdentifyingData: true;
  requiresLegalMarketingReview: true;
}

const STEPS: readonly PersonalCreditSelfHelpStep[] = Object.freeze([
  Object.freeze({
    id: "OBTAIN_REPORTS",
    title: "Request your own credit reports",
    instructions: "Visit the official authorized site directly. Keep your reports in your possession, not in the Quest Luxo portal.",
    resourceLabel: "Official free credit reports",
    resourceUrl: "https://www.annualcreditreport.com/",
    consumerActsIndependently: true,
  }),
  Object.freeze({
    id: "REVIEW_ACCURACY",
    title: "Review reports for genuine inaccuracies",
    instructions: "Review identity, account ownership, dates, balances, and payment status. Do not treat accurate negative information as an error.",
    resourceLabel: "CFPB: common credit report errors",
    resourceUrl: "https://www.consumerfinance.gov/ask-cfpb/what-are-common-credit-report-errors-that-i-should-look-for-on-my-credit-report-en-313/",
    consumerActsIndependently: true,
  }),
  Object.freeze({
    id: "CORRECT_REAL_ERRORS",
    title: "Learn how to dispute genuine errors yourself",
    instructions: "If an item is genuinely inaccurate, follow the CFPB guidance to contact the bureau and the information furnisher yourself. Quest Luxo does not prepare, send, track, or manage your disputes.",
    resourceLabel: "CFPB: how to dispute an error",
    resourceUrl: "https://www.consumerfinance.gov/ask-cfpb/how-do-i-dispute-an-error-on-my-credit-report-en-314/",
    consumerActsIndependently: true,
  }),
  Object.freeze({
    id: "BUILD_HEALTHY_HABITS",
    title: "Learn long-term credit habits",
    instructions: "Review the roles of payment history, credit utilization, budgeting, and responsible borrowing. Improving habits does not guarantee any score change.",
    resourceLabel: "FTC: understanding your credit",
    resourceUrl: "https://consumer.ftc.gov/articles/understanding-your-credit",
    consumerActsIndependently: true,
  }),
  Object.freeze({
    id: "REASSESS_FUNDING_GOAL",
    title: "Review your next business or real-estate goal",
    instructions: "Consider your financing goal and decide independently whether to request an ordinary, compliance-reviewed capital readiness assessment. This step never submits an application.",
    resourceLabel: "CFPB: can accurate negative information be removed?",
    resourceUrl: "https://www.consumerfinance.gov/ask-cfpb/is-it-possible-to-remove-accurate-negative-information-from-my-credit-report-en-1249/",
    consumerActsIndependently: true,
  }),
]);

export function getPersonalCreditSelfHelpProgram(): PersonalCreditSelfHelpProgram {
  return Object.freeze({
    title: "Personal Credit Self-Help Center",
    description: "Free, self-directed education on credit reports, fixing genuine errors, and responsible credit habits. No personalized repair service.",
    priceUsd: 0 as const,
    steps: STEPS,
    noCreditPulls: true as const,
    noDisputeGenerationOrSubmission: true as const,
    noScoreOrFundingGuarantees: true as const,
    noPersonallyIdentifyingData: true as const,
    requiresLegalMarketingReview: true as const,
  });
}

export interface PersonalCreditSelfHelpProgress {
  completedCount: number;
  totalCount: number;
  nextStepId: PersonalCreditSelfHelpStepId | null;
  /** Completion is not proof of credit improvement or lending eligibility. */
  readyForCreditOrFinancing: false;
}

/** Local-only educational checklist evaluation. Do not persist user details. */
export function summarizePersonalCreditSelfHelpProgress(
  completedStepIds: readonly PersonalCreditSelfHelpStepId[],
): PersonalCreditSelfHelpProgress {
  const completed = new Set(completedStepIds);
  const nextStep = STEPS.find(step => !completed.has(step.id));
  return Object.freeze({
    completedCount: STEPS.filter(step => completed.has(step.id)).length,
    totalCount: STEPS.length,
    nextStepId: nextStep?.id ?? null,
    readyForCreditOrFinancing: false as const,
  });
}
