import {
  getJavaScriptLab,
  isJavaScriptCodeLabExercise,
  type JavaScriptCodeLabSlug,
} from "./javascript-lab-progress";

export const GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY =
  "lovable-original:guided-playground-transfer:v1";

const GUIDED_PLAYGROUND_TRANSFER_VERSION = 1;
const GUIDED_PLAYGROUND_TRANSFER_MAX_SOURCE_LENGTH = 20_000;

type StoredGuidedPlaygroundTransfer = {
  version: typeof GUIDED_PLAYGROUND_TRANSFER_VERSION;
  labSlug: JavaScriptCodeLabSlug;
  exerciseId: string;
  source: string;
};

export type GuidedPlaygroundTransfer = StoredGuidedPlaygroundTransfer & {
  labTitle: string;
  exerciseTitle: string;
  returnHref: string;
};

function resolveGuidedPlaygroundTransfer(
  value: StoredGuidedPlaygroundTransfer,
): GuidedPlaygroundTransfer | null {
  if (
    value.version !== GUIDED_PLAYGROUND_TRANSFER_VERSION ||
    !isJavaScriptCodeLabExercise(value.labSlug, value.exerciseId) ||
    typeof value.source !== "string" ||
    value.source.length === 0 ||
    value.source.length > GUIDED_PLAYGROUND_TRANSFER_MAX_SOURCE_LENGTH
  ) {
    return null;
  }

  const lab = getJavaScriptLab(value.labSlug);
  const exerciseIndex = lab?.exerciseIds.findIndex(
    (exerciseId) => exerciseId === value.exerciseId,
  );
  if (!lab || exerciseIndex === undefined || exerciseIndex < 0) return null;

  return {
    ...value,
    labTitle: lab.title,
    exerciseTitle: lab.exerciseTitles[exerciseIndex],
    returnHref:
      "exerciseHrefs" in lab
        ? (lab.exerciseHrefs[exerciseIndex] ?? lab.href)
        : lab.href,
  };
}

export function serializeGuidedPlaygroundTransfer({
  labSlug,
  exerciseId,
  source,
}: {
  labSlug: JavaScriptCodeLabSlug;
  exerciseId: string;
  source: string;
}) {
  const transfer = resolveGuidedPlaygroundTransfer({
    version: GUIDED_PLAYGROUND_TRANSFER_VERSION,
    labSlug,
    exerciseId,
    source,
  });

  return transfer
    ? JSON.stringify({
        version: transfer.version,
        labSlug: transfer.labSlug,
        exerciseId: transfer.exerciseId,
        source: transfer.source,
      })
    : null;
}

export function parseGuidedPlaygroundTransfer(rawValue: string | null) {
  if (!rawValue || rawValue.length > GUIDED_PLAYGROUND_TRANSFER_MAX_SOURCE_LENGTH + 500) {
    return null;
  }

  try {
    const value = JSON.parse(rawValue) as Partial<StoredGuidedPlaygroundTransfer>;
    if (
      value.version !== GUIDED_PLAYGROUND_TRANSFER_VERSION ||
      typeof value.labSlug !== "string" ||
      typeof value.exerciseId !== "string" ||
      typeof value.source !== "string"
    ) {
      return null;
    }

    return resolveGuidedPlaygroundTransfer(
      value as StoredGuidedPlaygroundTransfer,
    );
  } catch {
    return null;
  }
}
