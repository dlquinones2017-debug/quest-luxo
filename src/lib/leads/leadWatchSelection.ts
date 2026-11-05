import {
  buildLeadContextLabel,
  createLeadIntakeContext,
  type LeadIntakeContext,
  type LeadIntakeContextInput,
} from "./leadIntakeContext.ts";

const comparableDescription = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLowerCase();

/** Free text is never parsed into a guessed catalog reference. */
export function reconcileLeadWatchContext(
  input: LeadIntakeContextInput,
  description: string,
): LeadIntakeContext {
  const context = createLeadIntakeContext(input);
  const label = buildLeadContextLabel(context);
  return label && comparableDescription(description) === comparableDescription(label)
    ? context
    : createLeadIntakeContext({ intent: context.intent });
}

type WatchInput = Pick<HTMLInputElement, "value" | "defaultValue" | "addEventListener">;

/** Keep the visible selection, history restoration and submitted context together. */
export function bindLeadWatchSelection(
  input: WatchInput,
  readContext: () => LeadIntakeContextInput,
  onChange: (context: LeadIntakeContext) => void,
): { sync: () => LeadIntakeContext } {
  let previousLabel: string | undefined;
  const sync = (): LeadIntakeContext => {
    const context = createLeadIntakeContext(readContext());
    const label = buildLeadContextLabel(context);
    let description = input.value;
    if (
      (previousLabel === undefined && !description.trim()) ||
      (previousLabel !== undefined && label !== previousLabel &&
        comparableDescription(description) === comparableDescription(previousLabel))
    ) {
      description = label;
    }
    if (label !== previousLabel) {
      // Native form.reset() restores the current selection, not a previous URL's watch.
      input.defaultValue = label;
      previousLabel = label;
    }
    if (input.value !== description) input.value = description;
    const requestContext = reconcileLeadWatchContext(context, description);
    onChange(requestContext);
    return requestContext;
  };
  input.addEventListener("input", sync);
  sync();
  return { sync };
}
