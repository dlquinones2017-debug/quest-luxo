import type { QuestLuxoAsset, QuestLuxoConfiguration } from "../types/questLuxo";

export const sourceCompletionReferenceInformation: readonly {
  brand: string; reference: string; sourceUrl: string; sourceLabel: string; configuration: QuestLuxoConfiguration;
}[] = [
  {
    brand: "Panerai", reference: "PAM01616",
    sourceUrl: "https://www.panerai.com/content/dam/pan-assets/016-presskit/pdf/carbotech/PR_PANERAI_SUBMERSIBLE_CARBOTECH_PAM00960_PAM01616_ENG.pdf",
    sourceLabel: "Panerai Submersible Carbotech manufacturer technical sheet (page 4; no price)",
    configuration: { movement: "Self-winding Panerai P.9010; 72-hour power reserve", waterResistance: "300 m" },
  },
  {
    "brand": "Audemars Piguet",
    "reference": "15202ST",
    "sourceUrl": "https://www.audemarspiguet.com/us/en/watch-collection/royal-oak/15202ST.OO.1240ST.01.A",
    "sourceLabel": "Audemars Piguet United States — indicative recommended public price",
    "configuration": {
      "caseSize": "39 mm",
      "movement": "Self-winding calibre 2121; 40-hour power reserve",
      "waterResistance": "50 m"
    }
  },
  {
    "brand": "Cartier",
    "reference": "WGPA0017",
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/pasha-de-cartier/pasha-de-cartier-watch--CRWGPA0017.html",
    "sourceLabel": "Cartier Saudi Arabia",
    "configuration": {
      "movement": "Self-winding Cartier 1904-CH MC chronograph",
      "waterResistance": "100 m"
    }
  },
  {
    "brand": "Cartier",
    "reference": "WSPA0038",
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/pasha-de-cartier/pasha-de-cartier-watch-CRWSPA0038.html",
    "sourceLabel": "Cartier Saudi Arabia",
    "configuration": {
      "movement": "Self-winding Cartier 1847 MC",
      "waterResistance": "100 m"
    }
  },
  {
    "brand": "Cartier",
    "reference": "WSBB0061",
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/ballon-de-cartier/ballon-bleu-de-cartier-watch-CRWSBB0061.html",
    "sourceLabel": "Cartier Saudi Arabia",
    "configuration": {
      "movement": "Self-winding Cartier 1847 MC",
      "waterResistance": "30 m"
    }
  },
  {
    "brand": "Franck Muller",
    "reference": "V 32 SC AT FO SMURFETTE (BL)",
    "sourceUrl": "https://www.franckmuller.com/news/vanguard-smurfette-party",
    "sourceLabel": "Franck Muller — November 2025 standard Smurfette price publication",
    "configuration": {}
  },
  {
    "brand": "Franck Muller",
    "reference": "V 32 SC AT FO SMURFETTE (RS)",
    "sourceUrl": "https://www.franckmuller.com/news/vanguard-smurfette-party",
    "sourceLabel": "Franck Muller — November 2025 standard Smurfette price publication",
    "configuration": {}
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH BU BL GF1",
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/vanguard-beach/",
    "sourceLabel": "Franck Muller Asia Pacific — Singapore regional list",
    "configuration": {
      "movement": "FM 800-DT automatic; 42-hour power reserve",
      "waterResistance": "30 m"
    }
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFBUBL (BC)",
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceLabel": "Franck Muller Asia Pacific — Singapore regional list",
    "configuration": {
      "movement": "MVT 2536-SCDT2H automatic; 42-hour power reserve",
      "waterResistance": "30 m"
    }
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFVRVE (BC)",
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceLabel": "Franck Muller Asia Pacific — Singapore regional list",
    "configuration": {
      "movement": "MVT 2536-SCDT2H automatic; 42-hour power reserve",
      "waterResistance": "30 m"
    }
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFRGFRG (BC)",
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceLabel": "Franck Muller Asia Pacific — Singapore regional list",
    "configuration": {
      "movement": "MVT 2536-SCDT2H automatic; 42-hour power reserve",
      "waterResistance": "30 m"
    }
  },
  {
    "brand": "Omega",
    "reference": "131.63.41.21.03.001",
    "sourceUrl": "https://www.bankslyon.co.uk/omega-constellation-co-axial-master-chronometer-41mm-watch-131-63-41-21-03-001/",
    "sourceLabel": "Banks Lyon — explicitly published OMEGA RRP",
    "configuration": {
      "movement": "Omega 8901 automatic Master Chronometer",
      "waterResistance": "50 m"
    }
  },
  {
    "brand": "Omega",
    "reference": "210.32.42.20.01.006",
    "sourceUrl": "https://www.bankslyon.co.uk/omega-seamaster-diver-300m-42mm-210-32-42-20-01-006/",
    "sourceLabel": "Banks Lyon — explicitly published OMEGA RRP",
    "configuration": {
      "movement": "Omega 8806 automatic Master Chronometer",
      "waterResistance": "300 m"
    }
  }
];

export function amendSourceCompletionReference(asset: QuestLuxoAsset, brand: string, pictured?: QuestLuxoAsset): QuestLuxoAsset {
  const profile = sourceCompletionReferenceInformation.find(p => p.brand === brand && p.reference === (asset.displayReference ?? asset.reference));
  if (!profile) return asset;
  // Keep the approved photograph's exact dial/strap labels and established route.
  const configurations = (pictured?.configurations ?? asset.configurations ?? []).map(c => ({ ...c, ...profile.configuration }));
  return {
    ...asset, configurations, specificationsReviewedAt: "2026-10-29",
    specificationSources: [...(asset.specificationSources ?? []), { label: profile.sourceLabel, url: profile.sourceUrl }],
    ...(asset.brokerageIntelligence ? { brokerageIntelligence: { ...asset.brokerageIntelligence,
      configurationSummary: Object.entries(configurations[0] ?? {}).filter(([key, value]) => ["caseSize", "movement", "dial", "bracelet", "waterResistance"].includes(key) && value).map(([, value]) => value).join("; "),
    } } : {}),
  };
}
