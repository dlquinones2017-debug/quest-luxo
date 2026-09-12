export type BrokerageThinMarginModelId =
  | "rolex-submariner"
  | "rolex-datejust-41"
  | "rolex-gmt-master-ii";

export interface BrokerageThinMarginModelConfig {
  readonly id: BrokerageThinMarginModelId;
  readonly label: string;
  readonly aliases: readonly string[];
  readonly referencePrefixes: readonly string[];
}

export const brokerageEconomicsRiskContingencies = Object.freeze({
  moderate: 500,
  severe: 1200,
});

export const brokerageThinMarginModels: readonly BrokerageThinMarginModelConfig[] =
  Object.freeze([
    Object.freeze({
      id: "rolex-submariner",
      label: "Rolex Submariner",
      aliases: Object.freeze(["Rolex Submariner", "Submariner"]),
      referencePrefixes: Object.freeze([
        "114060",
        "116610",
        "124060",
        "126610",
        "126613",
        "126618",
        "126619",
      ]),
    }),
    Object.freeze({
      id: "rolex-datejust-41",
      label: "Rolex Datejust 41",
      aliases: Object.freeze([
        "Rolex Datejust 41",
        "Datejust 41",
        "Rolex Datejust41",
        "Datejust41",
      ]),
      referencePrefixes: Object.freeze([
        "126300",
        "126301",
        "126303",
        "126331",
        "126333",
        "126334",
      ]),
    }),
    Object.freeze({
      id: "rolex-gmt-master-ii",
      label: "Rolex GMT-Master II",
      aliases: Object.freeze([
        "Rolex GMT-Master II",
        "GMT-Master II",
        "Rolex GMT Master II",
        "GMT Master II",
        "Rolex GMT-Master 2",
        "GMT-Master 2",
        "Rolex GMT Master 2",
        "GMT Master 2",
      ]),
      referencePrefixes: Object.freeze([
        "116710",
        "116713",
        "126710",
        "126711",
        "126713",
        "126715",
        "126718",
        "126719",
        "126720",
      ]),
    }),
  ]);
