import test from "node:test";
import assert from "node:assert/strict";
import { QLUX_AGENTIC_TEAM, getAgenticTeamStatus, getAgentsByDivision } from "../src/lib/agents/qluxAgenticTeam.ts";

test("enterprise agent registry covers core operating institutions", () => {
  for (const division of ["COMMAND_CENTER","LUXURY_ADVISORY","REALTY","CAPITAL_ADVISORY","GROWTH_ENGINE","MARKETING","WEBSITE_PRODUCT","ENTERPRISE_OPERATIONS"]) {
    assert.ok(getAgentsByDivision(division).length > 0, division);
  }
});

test("registry preserves founder gates and no autonomous external writes", () => {
  assert.ok(QLUX_AGENTIC_TEAM.every((agent) => agent.canWriteExternally === false));
  assert.ok(QLUX_AGENTIC_TEAM.filter((agent) => agent.status === "DEPLOYED").every((agent) => agent.founderGate));
});

test("registry reports truthful implementation state", () => {
  const status = getAgenticTeamStatus();
  assert.equal(status.total, QLUX_AGENTIC_TEAM.length);
  assert.ok(status.DEPLOYED >= 4);
  assert.ok(status.SPECIFIED > 0);
});
