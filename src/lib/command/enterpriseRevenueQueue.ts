import { revenueFounderQueue, type RevenueAction, type RevenueRecord } from "./revenueActivation.ts";

export interface EnterpriseRevenueQueueInput {
  brokerage?: readonly RevenueRecord[];
  capital?: readonly RevenueRecord[];
  realty?: readonly RevenueRecord[];
}

function assertDivision(records: readonly RevenueRecord[], division: RevenueRecord["division"]): void {
  for (const record of records) {
    if (record.division !== division) throw new Error(`Expected ${division} revenue record.`);
  }
}

export function enterpriseRevenueFounderQueue(
  input: EnterpriseRevenueQueueInput,
  now = new Date(),
): readonly RevenueAction[] {
  const brokerage = input.brokerage ?? [];
  const capital = input.capital ?? [];
  const realty = input.realty ?? [];
  assertDivision(brokerage, "WATCH_BROKERAGE");
  assertDivision(capital, "CAPITAL_ADVISORY");
  assertDivision(realty, "REALTY");
  return revenueFounderQueue([...brokerage, ...capital, ...realty], now);
}
