import type { QuestLuxoAsset, QuestLuxoConfiguration } from "../types/questLuxo";
import type { WatchPhotograph } from "../lib/media/watchPhotography";
import { clearedSprintPhotographySeeds } from "./photography-cleared-sprint.ts";

export interface PhotographySeed { brand: string; brandSlug: string; collection: string; reference: string; model: string; material: string; configuration: QuestLuxoConfiguration & {dial:string; bracelet:string; caseSize?:string}; sourceUrl:string; photographSourceUrl?:string; src:string; sha256:string; rawDriveFileId:string; clearanceRecord?:string; exactReference?:string; sourceProvider?:string; reviewedAt?:string; assetId?:string; }

// Exact configurations reviewed against manufacturer sources and original photographs.
// Existing Drive manufacturer images were cleared for website use by the founder on October 13, 2026.
const seeds: readonly PhotographySeed[] = [
  ...clearedSprintPhotographySeeds,
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Marine",
    "reference": "1183-310/40",
    "model": "Marine Torpilleur",
    "material": "Stainless steel",
    "configuration": {
      "dial": "White lacquered, Roman numerals",
      "bracelet": "Black alligator strap",
      "caseSize": "42 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-us/watches/marine/1183-310-40",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-marine-torpilleur-1183-310-40-web.webp",
    "sha256": "f12a0f80f6eb0dde8b94b9c0df4106887f3f1922fa341732c61aa188125c911e",
    "rawDriveFileId": "1IYW4HtcVmrLJN2Isi1S9A3-2aL5RDTyd"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Marine",
    "reference": "1183-310-3A/0A",
    "model": "Marine Torpilleur",
    "material": "Stainless steel",
    "configuration": {
      "dial": "Blue, Roman numerals",
      "bracelet": "Blue fabric strap",
      "caseSize": "42 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-us/watches/marine/1183-310-3a-0a",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-marine-torpilleur-1183-310-3a-0a-web.webp",
    "sha256": "f6a9a5e6fb9dc5c943a7b1fd14880c1a4838d4dbd022bc48ec73db938c35451f",
    "rawDriveFileId": "1bqXVSvbjP7LBpOzfiwAjaX4hwZZMzMMt"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Marine",
    "reference": "1183-310-3/40",
    "model": "Marine Torpilleur",
    "material": "Stainless steel",
    "configuration": {
      "dial": "White lacquered, Roman numerals",
      "bracelet": "Black rubber / titanium strap",
      "caseSize": "42 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-us/watches/marine/1183-310-3-40",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-marine-torpilleur-1183-310-3-40-web.webp",
    "sha256": "b0fc015eebcef7fbd06c8945ff44fa4483837ecd1a567be510f74132324673be",
    "rawDriveFileId": "1HKNMW-64_XvfEkrBr8Y1E7TGqrd4DwmR"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Freak",
    "reference": "2303-270/03",
    "model": "Freak X Ti Blue",
    "material": "Titanium / blue PVD",
    "configuration": {
      "dial": "Blue movement display (no conventional dial)",
      "bracelet": "Blue alligator strap",
      "caseSize": "43 mm",
      "movement": "UN-230 self-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/watches/freak/2303-270-03",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-freak-x-ti-blue-2303-270-03-web.webp",
    "sha256": "cbb035dabb0fa9bad0584438c1dc5c0eddb2df83128366ed2b81417c1e4a2998",
    "rawDriveFileId": "1-ph8KGUe0R-SuqDVx2zQBQsWXp_F-cQv"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Freak",
    "reference": "2303-270.1/BLACK",
    "model": "Freak X Ti Black",
    "material": "Titanium / black PVD",
    "configuration": {
      "dial": "Black movement display (no conventional dial)",
      "bracelet": "Black openwork calf leather strap",
      "caseSize": "43 mm",
      "movement": "UN-230 self-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/watches/freak/2303-270-1-black",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-freak-x-ti-black-2303-270-1-black-web.webp",
    "sha256": "53c8ae8efc2d8ccc585e472b39431dc34f297be82a5427cf672696a3d00d701e",
    "rawDriveFileId": "1p27ygHSb39fVRGnRS1b8LZXrmyAJKuVH"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Freak",
    "reference": "2405-500-2A/3A",
    "model": "Freak ONE",
    "material": "Titanium / 18 ct gold",
    "configuration": {
      "dial": "Movement display (no conventional dial)",
      "bracelet": "Black rubber strap",
      "caseSize": "44 mm",
      "movement": "UN-240 self-winding",
      "waterResistance": "30 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-eu/watches/freak/2405-500-2a-3a",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-freak-one-2405-500-2a-3a-web.webp",
    "sha256": "0a6758ced24d486946aa7c80b10fee0af64657fe97ed9515dc13463ed3f4d4f8",
    "rawDriveFileId": "1C5mhNWxyqD6s9gR92Zk8JOh1AZAfbXqg"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Diver",
    "reference": "1183-170-7M/92",
    "model": "Diver 44",
    "material": "Titanium",
    "configuration": {
      "dial": "Black",
      "bracelet": "Titanium bracelet",
      "caseSize": "44 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "300 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-sg/watches/diver/1183-170-7m-92",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-diver-44-1183-170-7m-92-web.webp",
    "sha256": "ef9ca85bda856d8afa8f80605b28eb70383eaeee0e8103295328aff48f7ea53d",
    "rawDriveFileId": "1WHwOSoIXGgOfqkrkPOnPYY2tPdK8bBJl"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Diver",
    "reference": "1183-170-3/93",
    "model": "Diver 44",
    "material": "Titanium",
    "configuration": {
      "dial": "Blue",
      "bracelet": "Blue rubber / titanium strap",
      "caseSize": "44 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "300 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-us/watches/diver/1183-170-3-93",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-diver-44-1183-170-3-93-web.webp",
    "sha256": "9375fe0e023ccc006e74782f0f529a5ae9a557d7368b949df11cdbb74860aa7a",
    "rawDriveFileId": "1Shwn23mWZsg9e9SXFBtMSyiVovHMwtON"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Diver",
    "reference": "1183-170-3/92",
    "model": "Diver 44",
    "material": "Titanium",
    "configuration": {
      "dial": "Black",
      "bracelet": "Black rubber / titanium strap",
      "caseSize": "44 mm",
      "movement": "UN-118 self-winding",
      "waterResistance": "300 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/en-gb/watches/diver/1183-170-3-92",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-diver-44-1183-170-3-92-web.webp",
    "sha256": "26825c394669e4fe298c3a47f75205c228a09703400aa515616a031fff4f52ad",
    "rawDriveFileId": "1EjTQI0yV6tQXCOyuFUjaSLbJ0CAj28vF"
  },
  {
    "brand": "Ulysse Nardin",
    "brandSlug": "ulysse-nardin",
    "collection": "Blast",
    "reference": "3713-260-3/03",
    "model": "Blast Skeleton X",
    "material": "Titanium",
    "configuration": {
      "dial": "Skeletonized movement display",
      "bracelet": "Blue rubber strap",
      "caseSize": "42 mm",
      "movement": "UN-371 manual-winding",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.ulysse-nardin.com/watches/blast/3713-260-3-03",
    "src": "/images/watches/ulysse-nardin/ulysse-nardin-blast-skeleton-x-3713-260-3-03-web.webp",
    "sha256": "25f34445974bb0b12530b0b38101c4026c85f3baa624608159a83ac47faab0e4",
    "rawDriveFileId": "1JdZm5Mww0bDFORYUozO37TtET0RgvW6k"
  },
  {
    "brand": "Tudor",
    "brandSlug": "tudor",
    "collection": "Pelagos",
    "reference": "M25407N-0001",
    "model": "Pelagos 39",
    "material": "Titanium",
    "configuration": {
      "dial": "Black",
      "bracelet": "Titanium bracelet",
      "caseSize": "39 mm"
    },
    "sourceUrl": "https://www.tudorwatch.com/en/watches/pelagos/m25407n-0001",
    "src": "/images/watches/tudor/tudor-pelagos-39-m25407n-0001-web.webp",
    "sha256": "bd440d57a880b463260666d337967ad8c5e44a9c06336244ff866284f424f2f9",
    "rawDriveFileId": "14tErGD4-qbFiVwt7p_10ZwNfVdIB1HYS"
  },
  {
    "brand": "Tudor",
    "brandSlug": "tudor",
    "collection": "Black Bay",
    "reference": "M79000N-0001",
    "model": "Black Bay 54",
    "material": "Stainless Steel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Stainless-steel bracelet",
      "caseSize": "37 mm"
    },
    "sourceUrl": "https://www.tudorwatch.com/en/watches/black-bay-54/m79000n-0001",
    "src": "/images/watches/tudor/tudor-black-bay-54-m79000n-0001-web.webp",
    "sha256": "7d5a6f51661d7e11c1a895ee8f67f74cc5c77d8b71c39f32743a6fefd6428d35",
    "rawDriveFileId": "1OSmR4Gvl5ZC50CNYyPVAUcUssYFA6lmQ"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Submariner",
    "reference": "126618LB",
    "model": "Submariner Date",
    "material": "18 ct Yellow Gold",
    "configuration": {
      "dial": "Blue",
      "bracelet": "Gold Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/watches/submariner/m126618lb-0002",
    "src": "/images/watches/rolex/rolex-submariner-date-126618lb-web.webp",
    "sha256": "70191f274fe4cd83e38d19a908e9ac54f7a66b17b051e2e2757316f40ae2d59f",
    "rawDriveFileId": "1WHsQJd3A_sKnDLl5gADMEfKVk4qKMHNT"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Submariner",
    "reference": "126613LB",
    "model": "Submariner Date",
    "material": "Yellow Rolesor",
    "configuration": {
      "dial": "Blue",
      "bracelet": "Two-Tone Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/submariner/m126613lb-0002",
    "src": "/images/watches/rolex/rolex-submariner-date-126613lb-web.webp",
    "sha256": "24fc98f2710ce8948a19646a4e6212f5643737a1898877c0d027095bc4b87c4a",
    "rawDriveFileId": "1ROtz1H0mpVjmrWjf7Sx51rWZGdoVdDg9"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Submariner",
    "reference": "126610LV",
    "model": "Submariner Date",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/submariner/m126610lv-0002",
    "src": "/images/watches/rolex/rolex-submariner-date-126610lv-web.webp",
    "sha256": "360116a790e061a9ca6e0d0e4feedd58f0e716ff0cb6b62f61ed9e19a150d6ed",
    "rawDriveFileId": "1cSYtLb0cCJtkch_yTEgpW4z8pFFPIDQK"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Submariner",
    "reference": "126610LN",
    "model": "Submariner Date",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/submariner/m126610ln-0001",
    "src": "/images/watches/rolex/rolex-submariner-date-126610ln-web.webp",
    "sha256": "c4abd8938eae5d67b9e523599845354de8739146559afa8e0a68da1931907f12",
    "rawDriveFileId": "16Cjjd7k3Xhgob5Gki84a3GnJcMziuX59"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Sky-Dweller",
    "reference": "336938",
    "model": "Sky-Dweller",
    "material": "18 ct Yellow Gold",
    "configuration": {
      "dial": "Intense White",
      "bracelet": "Gold Oyster",
      "caseSize": "42 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/sky-dweller/m336938-0003",
    "src": "/images/watches/rolex/rolex-sky-dweller-336938-intense-white-oyster-web.webp",
    "sha256": "019411095e89a6ace49c23db6ece894d2aaf9cb6946354df4fa73e219f1255b0",
    "rawDriveFileId": "1p-TMTT6dNw9eyBjQFvTd0BlWDT4UFSOM"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Sky-Dweller",
    "reference": "336935",
    "model": "Sky-Dweller",
    "material": "18 ct Everose Gold",
    "configuration": {
      "dial": "Intense White",
      "bracelet": "Gold Jubilee",
      "caseSize": "42 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/sky-dweller/m336935-0007",
    "src": "/images/watches/rolex/rolex-sky-dweller-336935-intense-white-jubilee-web.webp",
    "sha256": "6f596df6e808c786aae44e04d230ee1cc699a886dc61f63006d40241a17b0cbf",
    "rawDriveFileId": "1FDVc5ijQS4ASFWl1tG-aedw3iIysDZNy"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Sky-Dweller",
    "reference": "336934",
    "model": "Sky-Dweller",
    "material": "Oystersteel / White Gold",
    "configuration": {
      "dial": "Mint Green",
      "bracelet": "Oyster",
      "caseSize": "42 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/sky-dweller/m336934-0001",
    "src": "/images/watches/rolex/rolex-sky-dweller-336934-mint-green-oyster-web.webp",
    "sha256": "5868839c1f072467b3a45db3689c7102b995f7019a1e7b7f3b80d73128333987",
    "rawDriveFileId": "12p8l54ac1w2gv22lTg2Psa2jy8LjyTyn"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Sky-Dweller",
    "reference": "336933",
    "model": "Sky-Dweller",
    "material": "Yellow Rolesor",
    "configuration": {
      "dial": "Bright Black",
      "bracelet": "Two-Tone Oyster",
      "caseSize": "42 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/sky-dweller/m336933-0003",
    "src": "/images/watches/rolex/rolex-sky-dweller-336933-bright-black-oyster-web.webp",
    "sha256": "df155161427c2c77eefc99089e55b38ba315370da4b21b2d787f3c9af1ae68a0",
    "rawDriveFileId": "1mz5g7OQ0GnbGTC9XsWlH8IA51OKA-S68"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "GMT-Master II",
    "reference": "126720VTNR",
    "model": "GMT-Master II",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Jubilee",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-sg/watches/gmt-master-ii/m126720vtnr-0002",
    "src": "/images/watches/rolex/rolex-gmt-master-ii-126720vtnr-web.webp",
    "sha256": "ccd4a2804e3f7255b22974854ae05bb26aca8211a50784072c214ce4283d3b10",
    "rawDriveFileId": "1ONQmo1QvN40zf7K_u8OQ-2Q-ifO8WWwV"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "GMT-Master II",
    "reference": "126710BLNR",
    "model": "GMT-Master II",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Oyster",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/gmt-master-ii/m126710blnr-0003",
    "src": "/images/watches/rolex/rolex-gmt-master-ii-126710blnr-oyster-web.webp",
    "sha256": "27a6e81f2279d02490116e001ee5a636e749019f8983ca90a79055ede31695f6",
    "rawDriveFileId": "1AWywF10BySwcLwkVh_FVcP2QBjisof7W"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "GMT-Master II",
    "reference": "126710BLNR",
    "model": "GMT-Master II",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Jubilee",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/gmt-master-ii/m126710blnr-0002",
    "src": "/images/watches/rolex/rolex-gmt-master-ii-126710blnr-jubilee-web.webp",
    "sha256": "e901970ef0652e6ceffbd468589ad4ee835f7962f53580d660817f913a239e07",
    "rawDriveFileId": "1NZDzv8IyZUbpupx25WCPykGtWUE7jdGe"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Day-Date",
    "reference": "228236",
    "model": "Day-Date 40",
    "material": "Platinum",
    "configuration": {
      "dial": "Meteorite set with diamonds",
      "bracelet": "President",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/day-date/m228236-0011",
    "src": "/images/watches/rolex/rolex-day-date-40-228236-platinum-web.webp",
    "sha256": "752db28c5bbd99747708b5a48dfff5b53b0ee7779cad4f0676290fd4263c62fd",
    "rawDriveFileId": "1SRefEEDaxumH070vcq-4WP0CBUYOTqR8"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Day-Date",
    "reference": "228235",
    "model": "Day-Date 40",
    "material": "18k Everose Gold",
    "configuration": {
      "dial": "Chocolate set with diamonds",
      "bracelet": "President",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/day-date/m228235-0003",
    "src": "/images/watches/rolex/rolex-day-date-40-228235-chocolate-diamond-dial-web.webp",
    "sha256": "9734af9ca8ecfd4bb4ac210826a0081ebb5a806b9844ac1939a92d91ac402907",
    "rawDriveFileId": "16DYyJCFlXetRWQA3cLfvmrWq_DvXfpBM"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Datejust",
    "reference": "126334",
    "model": "Datejust 41",
    "material": "Oystersteel / White Gold",
    "configuration": {
      "dial": "Bright Blue",
      "bracelet": "Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/datejust/m126334-0001",
    "src": "/images/watches/rolex/rolex-datejust-41-126334-bright-blue-oyster-web.webp",
    "sha256": "0190763bde60ff443609c2b24069ebf87cebf78551b51c0fee1cbf7b2d73b7c9",
    "rawDriveFileId": "1STULSZLuGzQCOhWqkcjXF7g6u4JZGFTe"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Datejust",
    "reference": "126333",
    "model": "Datejust 41",
    "material": "Yellow Rolesor",
    "configuration": {
      "dial": "Silver",
      "bracelet": "Two-Tone Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/datejust/m126333-0001",
    "src": "/images/watches/rolex/rolex-datejust-41-126333-silver-oyster-web.webp",
    "sha256": "97bc72c87d7b7ccac9ad360261e1be62883df1b86281b1310fc39ccce4ff23fd",
    "rawDriveFileId": "19sZHcLpPPH09jG_p6PBT-kuILAILy2an"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Datejust",
    "reference": "126303",
    "model": "Datejust 41",
    "material": "Yellow Rolesor",
    "configuration": {
      "dial": "Silver",
      "bracelet": "Two-Tone Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/datejust/m126303-0001",
    "src": "/images/watches/rolex/rolex-datejust-41-126303-silver-oyster-web.webp",
    "sha256": "a12c4fc0ae0f77ea67083a84eaa53c515116015285ee0ad21842ca5ca748dc56",
    "rawDriveFileId": "1Dy2nJl7Eo_RgbODNhZJlCL1EEbmz29e9"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Datejust",
    "reference": "126300",
    "model": "Datejust 41",
    "material": "Oystersteel",
    "configuration": {
      "dial": "Bright Blue",
      "bracelet": "Oyster",
      "caseSize": "41 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/datejust/m126300-0001",
    "src": "/images/watches/rolex/rolex-datejust-41-126300-bright-blue-oyster-web.webp",
    "sha256": "c3da483696ee719c660f547a4763543aa497b1951cfb7e868e63fd9fe09589b3",
    "rawDriveFileId": "1Laqm2Uvg8ly4lLs33Ph_CqxK6Tif138K"
  },
  {
    "brand": "Rolex",
    "brandSlug": "rolex",
    "collection": "Daytona",
    "reference": "126500LN",
    "model": "Cosmograph Daytona",
    "material": "Oystersteel",
    "configuration": {
      "dial": "White",
      "bracelet": "Oyster",
      "caseSize": "40 mm"
    },
    "sourceUrl": "https://www.rolex.com/en-us/watches/cosmograph-daytona/m126500ln-0001",
    "src": "/images/watches/rolex/rolex-cosmograph-daytona-126500ln-white-dial-web.webp",
    "sha256": "b42c8dc29bd0cccebe62d444f92c91a1e0bd7cdae02199b98211dcadf1ca3e7b",
    "rawDriveFileId": "1SNt_1pPAHb_rOoP8NBHIOeqPVG6gNpeO"
  },
  {
    "brand": "Patek Philippe",
    "brandSlug": "patek-philippe",
    "collection": "Aquanaut",
    "reference": "5167A-001",
    "model": "Aquanaut Date",
    "material": "Stainless Steel",
    "configuration": {
      "caseSize": "40.8 mm",
      "movement": "Self-winding calibre 26-330 S C",
      "dial": "Charcoal gray with black-gradient rim",
      "bracelet": "Black composite strap",
      "waterResistance": "30 m"
    },
    "sourceUrl": "https://www.patek.com/en/collection/aquanaut/5167A-001",
    "src": "/images/watches/patek-philippe/patek-philippe-aquanaut-5167a-001-web.webp",
    "sha256": "7d490a64677b7532810c4482124e2fbe0cfe854d7d7b43ba959829a49a18ee03",
    "rawDriveFileId": "1_5dxpiAvWNz5hzSjjUwTjUqjuNACbu4p",
    "clearanceRecord": "Founder explicitly confirmed Quest Luxo website-use permission for this newly acquired exact-reference manufacturer/collaboration photograph on October 13, 2026."
  },
  {
    "brand": "Franck Muller",
    "brandSlug": "franck-muller",
    "collection": "Rabbit",
    "reference": "V 41 SC DT FR2 GFGRNR (NR)",
    "model": "#FR2NCK MULLER Vanguard",
    "material": "Carbon and Glass Fibre",
    "configuration": {
      "caseSize": "41 mm",
      "movement": "Self-winding FM 800-DT",
      "dial": "Matte White",
      "bracelet": "White textile strap",
      "waterResistance": "30 m"
    },
    "sourceUrl": "https://www.cortinawatch.com/en/franck-muller/limited-edition/v-41-sc-dt-fr2-gfgrnr-nr/",
    "src": "/images/watches/franck-muller/franck-muller-rabbit-v-41-sc-dt-fr2-gfgrnr-nr-web.webp",
    "sha256": "e68498bbba3b4abdd0b4876c9967e2cb77740a80c676a9a429adceda1906c5a2",
    "rawDriveFileId": "1hsP_EfUrp8KRu81Ovh0XP4pkZRtxbla-",
    "clearanceRecord": "Founder explicitly confirmed Quest Luxo website-use permission for this newly acquired exact-reference manufacturer/collaboration photograph on October 13, 2026."
  },
  {
    "brand": "Franck Muller",
    "brandSlug": "franck-muller",
    "collection": "Crazy Hours",
    "reference": "8880CHACLB",
    "model": "CintrÃ©e Curvex Crazy Hours",
    "material": "Stainless Steel",
    "configuration": {
      "movement": "Self-winding MVD FM 2800-CHR",
      "dial": "Powder blue sunray guillochÃ©",
      "caseSize": "55.4 × 39.6 mm",
      "bracelet": "Blue alligator leather strap"
    },
    "sourceUrl": "https://franckmuller-usa.com/cintree_curvex_men_crazy_hours/8880CHACLB_Cintr%C3%A9e_Curvex_Crazy_Hours",
    "src": "/images/watches/franck-muller/franck-muller-crazy-hours-8880chaclb-web.webp",
    "sha256": "d6129bc060d63156e064140ed70807bc62edc1d5b1d44876b12957a544ff9391",
    "rawDriveFileId": "1GOvUT2dsdo51ZjW54zYEDNTAGXImNqfH",
    "clearanceRecord": "Founder explicitly confirmed Quest Luxo website-use permission for this newly acquired exact-reference manufacturer/collaboration photograph on October 13, 2026."
  },
  {
    "brand": "Jaeger-LeCoultre",
    "brandSlug": "jaeger-lecoultre",
    "collection": "Master Control",
    "reference": "Q4018421",
    "model": "Master Control Date",
    "material": "Stainless Steel",
    "configuration": {
      "caseSize": "40 mm",
      "movement": "Automatic calibre 899",
      "dial": "Silvered gray sunray",
      "bracelet": "Black alligator leather strap",
      "waterResistance": "5 bar"
    },
    "sourceUrl": "https://www.jaeger-lecoultre.com/us-en/watches/master-control/master-control-date-stainless-steel-q4018421",
    "src": "/images/watches/jaeger-lecoultre/jaeger-lecoultre-master-control-q4018421-web.webp",
    "sha256": "e1f7ef5a33463afbe1ea297947140b51079c9b4e641901092bee1e9e36130a0d",
    "rawDriveFileId": "168nq84I2kLkOI6JdRAvl8qqNECfWOmc-",
    "clearanceRecord": "Founder explicitly confirmed Quest Luxo website-use permission for this newly acquired exact-reference manufacturer/collaboration photograph on October 13, 2026."
  },
  {
    "brand": "Jaeger-LeCoultre",
    "brandSlug": "jaeger-lecoultre",
    "collection": "Master Grande Tradition",
    "reference": "Q52334E1",
    "model": "Master Grande Tradition Calibre 950",
    "material": "18K White Gold",
    "configuration": {
      "caseSize": "43 mm",
      "movement": "Automatic calibre 950; minute repeater and perpetual calendar",
      "dial": "Blue guillochÃ© enamel",
      "bracelet": "Blue alligator leather strap",
      "waterResistance": "5 bar"
    },
    "sourceUrl": "https://www.jaeger-lecoultre.com/us-en/watches/master-grande-tradition/master-grande-tradition-calibre-950-white-gold-q52334e1",
    "src": "/images/watches/jaeger-lecoultre/jaeger-lecoultre-master-grande-tradition-q52334e1-web.webp",
    "sha256": "94f2a085a0407d0568b4f75401ef1e28d5569f17d81f8f5b943e7fa7bc5dc9ad",
    "rawDriveFileId": "1LF9NgGH8B0IshoXX0ONTrb38KWVaBjTT",
    "clearanceRecord": "Founder explicitly confirmed Quest Luxo website-use permission for this newly acquired exact-reference manufacturer/collaboration photograph on October 13, 2026."
  },
  {
    "brand": "Cartier",
    "brandSlug": "cartier",
    "collection": "Santos de Cartier",
    "reference": "WSSA0018",
    "model": "Santos de Cartier Large",
    "material": "Stainless Steel",
    "configuration": {
      "dial": "Silvered Opaline",
      "bracelet": "Steel SmartLink Bracelet",
      "caseSize": "39.8 mm wide",
      "movement": "Automatic calibre 1847 MC",
      "waterResistance": "100 m"
    },
    "sourceUrl": "https://int.cartier.com/en/collections/watches/choose-your-watch/by-material/steel-watches/wssa0018-santos-de-cartier-watch.html",
    "src": "/images/watches/cartier/cartier-santos-wssa0018-web.webp",
    "sha256": "ebaf01395fb40dd56df647eddd2dd0b7048ac48e4964c2b2c92382de46333403",
    "rawDriveFileId": "12fpNPveqsbNrDPYN7WiR94ZQ-QNG_nmd",
    "clearanceRecord": "Founder confirmed Quest Luxo website-use permission for manufacturer photographs already in the existing Drive photography library on October 13, 2026."
  },
  {
    "brand": "Omega",
    "brandSlug": "omega",
    "collection": "Speedmaster",
    "reference": "311.30.42.30.01.005",
    "model": "Speedmaster Moonwatch Professional 1861 Hesalite",
    "material": "Stainless Steel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Stainless Steel Bracelet",
      "caseSize": "42 mm",
      "movement": "Manual-winding Omega 1861",
      "waterResistance": "50 m"
    },
    "sourceUrl": "https://www.omegawatches.com/watch-omega-speedmaster-moonwatch-professional-chronograph-42-mm-31130423001005",
    "src": "/images/watches/omega/omega-speedmaster-311-30-42-30-01-005-web.webp",
    "sha256": "78b25206c22b5e2d59289a23664d0c1be9881641189556833dfbb24b4a18e4e5",
    "rawDriveFileId": "1FvinwTYUaWiUtrA9MNlMs2rR0_3m4qd3",
    "clearanceRecord": "Founder confirmed Quest Luxo website-use permission for manufacturer photographs already in the existing Drive photography library on October 13, 2026."
  },
  {
    "brand": "Omega",
    "brandSlug": "omega",
    "collection": "Seamaster Diver 300M",
    "reference": "210.30.42.20.01.001",
    "model": "Seamaster Diver 300M Co-Axial Master Chronometer",
    "material": "Stainless Steel",
    "configuration": {
      "dial": "Black wave-pattern",
      "bracelet": "Stainless-steel bracelet",
      "caseSize": "42 mm",
      "movement": "Self-winding Omega 8800",
      "waterResistance": "300 m"
    },
    "sourceUrl": "https://www.omegawatches.com/watch-omega-seamaster-diver-300m-co-axial-master-chronometer-42-mm-21030422001001",
    "src": "/images/watches/omega/omega-seamaster-diver-300m-210-30-42-20-01-001-web.webp",
    "sha256": "d4c52129ef18076c8cef729fe7421bd27924f7aaa1f1de549943fdeac729de3c",
    "rawDriveFileId": "1ud82b4VlMCaY1eVRhccmAtXBHFQewhwC",
    "clearanceRecord": "Founder confirmed Quest Luxo website-use permission for manufacturer photographs already in the existing Drive photography library on October 13, 2026."
  },
  {
    "brand": "Tudor",
    "brandSlug": "tudor",
    "collection": "Black Bay",
    "reference": "79030N",
    "model": "Black Bay 58",
    "material": "Stainless Steel",
    "configuration": {
      "dial": "Black",
      "bracelet": "Riveted Steel Bracelet",
      "caseSize": "39 mm",
      "movement": "Self-winding manufacture MT5402 (COSC)",
      "waterResistance": "200 m"
    },
    "sourceUrl": "https://media.tudorwatch.com/image/upload/fl_attachment/v1/tudorwatch/pressroom/products/black-bay-58/pdf/bw18-tudor-black-bay-fifty-eight-en.pdf",
    "src": "/images/watches/tudor/tudor-black-bay-58-m79030n-0001-web.webp",
    "sha256": "f7436fb0cdd7a408deea1485a9740f126db05b00cba61fa5b6c38d0a5de72f90",
    "rawDriveFileId": "1Jo_VTWQrTczawYTzqUYlQHhZYa3Fz9uL",
    "clearanceRecord": "Founder confirmed Quest Luxo website-use permission for manufacturer photographs already in the existing Drive photography library on October 13, 2026."
  },
  {
    "brand": "F.P. Journe",
    "brandSlug": "fp-journe",
    "collection": "Chronomètre Bleu",
    "reference": "CB",
    "model": "Chronomètre Bleu",
    "material": "Tantalum",
    "configuration": {
      "dial": "Chrome blue",
      "bracelet": "Blue leather strap",
      "caseSize": "39 mm",
      "movement": "Manual-winding calibre 1304"
    },
    "sourceUrl": "https://www.fpjourne.com/en/collection/classique-collection/chronometre-bleu",
    "src": "/images/watches/fp-journe/fp-journe-chronometre-bleu-cb-web.webp",
    "sha256": "ec9cad79c032b4e6f638f86728c40a07b78fd51f67578cf86d321fcbc18868ef",
    "rawDriveFileId": "11j0WkpBIOT3h99pfStf_smXgeMmbZ7C3",
    "clearanceRecord": "Founder confirmed Quest Luxo website-use permission for manufacturer photographs already in the existing Drive photography library on October 13, 2026."
  }
];

export const photographyExpansionAssets: QuestLuxoAsset[] = [];
for (const seed of seeds) {
  const existing = photographyExpansionAssets.find(a => a.brand === seed.brand && a.collection === seed.collection && a.reference === seed.reference);
  const configuration = { ...seed.configuration, nickname: seed.configuration.nickname ?? `${seed.configuration.dial} / ${seed.configuration.bracelet}`, originalMSRP: null, currentMSRP: null };
  if (existing) {
    existing.configurations = [...(existing.configurations ?? []), configuration];
    existing.specificationSources = [...(existing.specificationSources ?? []), { label: `${seed.brand} reference source`, url: seed.sourceUrl }];
    continue;
  }
  photographyExpansionAssets.push({ brand:seed.brand, collection:seed.collection, reference:seed.reference, model:seed.model, material:seed.material, configurations:[configuration], liquidity:"Not assessed", allocationDifficulty:"Availability requires a market check", questLuxoView:`Verified ${seed.brand} ${seed.model} configuration. The photograph depicts ${seed.configuration.dial} with ${seed.configuration.bracelet}. Price, condition, completeness and sourcing availability require an individual review.`, specificationSources:[{label:`${seed.brand} reference source`,url:seed.sourceUrl}], specificationsReviewedAt:seed.reviewedAt ?? "2026-10-13" });
}

export const photographyExpansionImages: readonly WatchPhotograph[] = seeds.map(seed => ({
  assetId:seed.assetId ?? `manufacturer-library-${seed.rawDriveFileId}`, brand:seed.brand, collection:seed.collection, reference:seed.reference, configuration:{dial:seed.configuration.dial,bracelet:seed.configuration.bracelet,material:seed.material,caseSize:seed.configuration.caseSize}, src:seed.src, alt:`Authentic ${seed.brand} ${seed.model} ref. ${seed.exactReference ?? seed.reference}, ${seed.configuration.dial}, ${seed.configuration.bracelet}`, background:"white", authenticPhotography:true, exactConfigurationVerified:true, sourceUrl:seed.photographSourceUrl ?? seed.sourceUrl, photographer:seed.sourceProvider ?? `${seed.brand} product photography`, licenseRecord:`${seed.clearanceRecord ?? "Founder confirmed Quest Luxo website-use permission for existing Drive manufacturer photographs on October 13, 2026."} Preserved RAW file: ${seed.rawDriveFileId}. Pictured full reference ${seed.exactReference ?? seed.reference}; ${seed.material}, ${seed.configuration.dial}, ${seed.configuration.bracelet}. Exact configuration reviewed against preserved source evidence and the original photograph.`, websiteApproved:true, commercialUse:"allowed", usageConditionsSatisfied:true, rightsExpiresAt:null, reviewedAt:seed.reviewedAt ?? "2026-10-13", reviewer:"Quest Luxo execution review with founder website-use clearance", sha256:seed.sha256, attribution:`${seed.sourceProvider ?? `${seed.brand} product photography`}. Pictured reference ${seed.exactReference ?? seed.reference}. Preserved authentic RAW centered on a 2400 x 2400 blank white master and resized to a 1200 x 1200 WEB derivative; no generative watch modifications.`, hero:true
}));
