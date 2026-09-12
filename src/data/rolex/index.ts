import { rolexDatejustAssets } from "./datejust";
import { rolexSubmarinerAssets } from "./submariner";
import { rolexDaytonaAssets } from "./daytona";
import { rolexGMTMasterIIAssets } from "./gmt-master-ii";
import { rolexDayDateAssets } from "./day-date";
import { rolexExplorerAssets } from "./explorer";
import { rolexExplorerIIAssets } from "./explorer-ii";
import { rolexYachtMasterAssets } from "./yacht-master";
import { rolexSeaDwellerAssets } from "./sea-dweller";
import { rolexAirKingAssets } from "./air-king";
import { rolexMilgaussAssets } from "./milgauss";
import { rolexOysterPerpetualAssets } from "./oyster-perpetual";
import { rolexSkyDwellerAssets } from "./sky-dweller";
import { rolex1908Assets } from "./1908";

export { rolexDatejustAssets } from "./datejust";
export { rolexSubmarinerAssets } from "./submariner";
export { rolexDaytonaAssets } from "./daytona";
export { rolexGMTMasterIIAssets } from "./gmt-master-ii";
export { rolexDayDateAssets } from "./day-date";
export { rolexExplorerAssets } from "./explorer";
export { rolexExplorerIIAssets } from "./explorer-ii";
export { rolexYachtMasterAssets } from "./yacht-master";
export { rolexSeaDwellerAssets } from "./sea-dweller";
export { rolexAirKingAssets } from "./air-king";
export { rolexMilgaussAssets } from "./milgauss";
export { rolexOysterPerpetualAssets } from "./oyster-perpetual";
export { rolexSkyDwellerAssets } from "./sky-dweller";
export { rolex1908Assets } from "./1908";

export const rolexCollections = {
  datejust: rolexDatejustAssets,
  submariner: rolexSubmarinerAssets,
  daytona: rolexDaytonaAssets,
  gmtMasterII: rolexGMTMasterIIAssets,
  dayDate: rolexDayDateAssets,
  explorer: rolexExplorerAssets,
  explorerII: rolexExplorerIIAssets,
  yachtMaster: rolexYachtMasterAssets,
  seaDweller: rolexSeaDwellerAssets,
  airKing: rolexAirKingAssets,
  milgauss: rolexMilgaussAssets,
  oysterPerpetual: rolexOysterPerpetualAssets,
  skyDweller: rolexSkyDwellerAssets,
  rolex1908: rolex1908Assets,
};

export const rolexAssets = [
  ...rolexDatejustAssets,
  ...rolexSubmarinerAssets,
  ...rolexDaytonaAssets,
  ...rolexGMTMasterIIAssets,
  ...rolexDayDateAssets,
  ...rolexExplorerAssets,
  ...rolexExplorerIIAssets,
  ...rolexYachtMasterAssets,
  ...rolexSeaDwellerAssets,
  ...rolexAirKingAssets,
  ...rolexMilgaussAssets,
  ...rolexOysterPerpetualAssets,
  ...rolexSkyDwellerAssets,
  ...rolex1908Assets,
];

export { rolexRegistry, rolexRegistryAssets } from "./registry";