// Certainty comes only from visible declarations and melds, never concealed tiles.
export function tenpaiEstimate(view, player, modelProbability = null) {
  const riichi = view?.reach?.[player] || view?.pendingReach?.[player]
    || view?.rivers?.[player]?.some(discard => discard.reach);
  if (riichi) return { probability: 1, reason: 'riichi' };
  if (view?.melds?.[player]?.length === 4) {
    return { probability: 1, reason: 'tanki' };
  }
  return { probability: modelProbability, reason: null };
}

// Also normalizes previously saved reports without running the model again.
export function correctReportTenpai(report) {
  return {
    ...report,
    decisions: report.decisions.map(decision => {
      const raw = decision.tenpaiRaw || decision.tenpai;
      const state = report.snapshots[decision.snapshot];
      const estimates = raw.map((value, index) =>
        tenpaiEstimate(state, (decision.player + index + 1) % 4, value));
      return {
        ...decision,
        tenpaiRaw: raw,
        tenpai: estimates.map(value => value.probability),
        tenpaiReasons: estimates.map(value => value.reason),
      };
    }),
  };
}
