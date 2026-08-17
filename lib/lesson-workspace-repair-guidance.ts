import type { CssPracticeCheck } from "@/lib/css-box-model-practice";
import type { ResponsiveCssCheck } from "@/lib/responsive-css-practice";
import type { SemanticHtmlCheck } from "@/lib/semantic-html-workspace";

export type LessonWorkspaceCheckId =
  | SemanticHtmlCheck["id"]
  | CssPracticeCheck["id"]
  | ResponsiveCssCheck["id"];

export type LessonWorkspaceRepairGuidance = {
  concept: string;
  inspect: string;
  nextAttempt: string;
};

const LESSON_WORKSPACE_REPAIR_GUIDANCE: Record<
  LessonWorkspaceCheckId,
  LessonWorkspaceRepairGuidance
> = {
  "page-header": {
    concept: "Landmark order",
    inspect:
      "Follow the page from its introduction into the primary content. Check whether the opening region finishes before the main content begins.",
    nextAttempt:
      "Compare the first three large page regions with the reading order taught in the lesson.",
  },
  "main-article": {
    concept: "Main content and article boundaries",
    inspect:
      "Identify the page’s single primary-content region, then check whether the complete standalone story sits inside it.",
    nextAttempt:
      "Trace the story from its title through its final paragraph without leaving that boundary.",
  },
  "article-heading": {
    concept: "Heading purpose",
    inspect:
      "Read the article’s first heading by itself. It should name the whole story rather than one smaller section.",
    nextAttempt:
      "Ask whether that heading still describes every section that follows it.",
  },
  "article-section": {
    concept: "Named content groups",
    inspect:
      "Find one idea inside the article that deserves its own named region, then check what heading introduces it.",
    nextAttempt:
      "Read the section heading beside its paragraphs and confirm they answer the same topic.",
  },
  "page-footer": {
    concept: "Closing landmark order",
    inspect:
      "Follow the document past the primary content and locate the supporting closing information.",
    nextAttempt:
      "Confirm the closing region follows the main content instead of interrupting it.",
  },
  "card-selector": {
    concept: "Class-scoped rules",
    inspect:
      "Find the rule intended for the whole card and check whether its card-level declarations stay together.",
    nextAttempt:
      "Match the class on the preview card with the rule that controls its width and surface.",
  },
  "descendant-selector": {
    concept: "Descendant selectors",
    inspect:
      "Find the rule for the emphasized lesson count and check whether its scope begins with the card.",
    nextAttempt:
      "Verify that the emphasis changes inside this card without changing unrelated strong text.",
  },
  "border-box": {
    concept: "The sizing model",
    inspect:
      "Compare the declared card width with the rendered width after its inner space and edge are included.",
    nextAttempt:
      "Use the live box-model explanation to make the rendered width match the declared width.",
  },
  "inner-space": {
    concept: "Inner spacing and visible edges",
    inspect:
      "Look between the text and the card edge, then check whether the card boundary is visibly distinct.",
    nextAttempt:
      "Give the content breathing room and make the outer edge readable in the preview.",
  },
  "grid-layout": {
    concept: "Grid formatting context",
    inspect:
      "Find the resource container rule and check which layout mode it creates for the cards inside it.",
    nextAttempt:
      "Use the preview to confirm the cards participate in one shared row-and-column system.",
  },
  "fluid-columns": {
    concept: "Fluid grid tracks",
    inspect:
      "Read the column rule as three decisions: repeat tracks, respond to available space, and allow each track to flex.",
    nextAttempt:
      "Switch between preview widths and check that the column count changes without a fixed breakpoint.",
  },
  "grid-gap": {
    concept: "Container-controlled spacing",
    inspect:
      "Look at the space between neighboring cards and check whether the grid container owns that spacing.",
    nextAttempt:
      "Create one consistent, non-zero space between tracks rather than spacing each card separately.",
  },
  "shrinkable-card": {
    concept: "Grid item minimum size",
    inspect:
      "Find the card rule and check whether long content is allowed to become narrower than its default minimum.",
    nextAttempt:
      "Use the narrow preview and confirm each card stays inside its grid track.",
  },
};

export function getLessonWorkspaceRepairGuidance(
  checkId: LessonWorkspaceCheckId,
) {
  return LESSON_WORKSPACE_REPAIR_GUIDANCE[checkId];
}
