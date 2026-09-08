// ============================================================================
// PRAGATI-RAIL — In-Browser ML Simulation Engine
// ----------------------------------------------------------------------------
// Mathematically-grounded stand-ins for the real Severity Classifier,
// Priority Score Engine (LightGBM) and Outcome Predictor / Cascading Delay
// Simulator described in mlmodels/. Deterministic-ish (seeded by defect id)
// so the same input always produces the same-looking AI output, but still
// reacts sensibly to the inputs given.
// ============================================================================

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  }
  return h;
}

function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Severity Classifier + Priority Score Engine simulation.
 * Inputs mirror the real feature set: track/asset type, speed band, GMT
 * traffic density, defect classification, and how overdue the item is.
 */
export function classifySeverityAndPriority(input = {}) {
  const rnd = seededRandom(hashSeed(input.id || input.defectType || 'seed'));

  const speedBand = Number(input.speedBand || input.maxSpeed || 110);
  const gmt = Number(input.gmt || input.trafficDensity || 25);
  const overdueDays = Number(input.overdueDays || 0);
  const baseSeverity = {
    Critical: 92,
    High: 76,
    Medium: 58,
    Low: 35
  }[input.severity] ?? (55 + rnd() * 25);

  const speedFactor = clamp((speedBand - 60) / 100, 0, 1); // faster lines = higher risk
  const gmtFactor = clamp(gmt / 60, 0, 1); // heavier traffic = higher risk
  const overdueFactor = clamp(overdueDays / 30, 0, 1);
  const pastFailureFactor = clamp(0.3 + rnd() * 0.5, 0, 1);
  const weatherFactor = clamp(0.15 + rnd() * 0.35, 0, 1);

  const severityScore = clamp(baseSeverity + speedFactor * 6 - 3, 0, 100);
  const urgencyScore = clamp(55 + overdueFactor * 30 + gmtFactor * 10, 0, 100);
  const assetImpactScore = clamp(50 + speedFactor * 35 + pastFailureFactor * 10, 0, 100);
  const trainImpactScore = clamp(45 + gmtFactor * 40, 0, 100);
  const overdueDaysScore = clamp(overdueFactor * 100, 0, 100);

  const priorityScore = clamp(
    severityScore * 0.35 +
      urgencyScore * 0.25 +
      assetImpactScore * 0.2 +
      trainImpactScore * 0.12 +
      overdueDaysScore * 0.08,
    0,
    100
  );

  let urgencyLevel = 'MEDIUM';
  let actionWindow = 'Within 7 Days';
  if (priorityScore >= 85) {
    urgencyLevel = 'CRITICAL';
    actionWindow = 'Within 24 Hours';
  } else if (priorityScore >= 68) {
    urgencyLevel = 'HIGH';
    actionWindow = 'Within 72 Hours';
  } else if (priorityScore >= 45) {
    urgencyLevel = 'MEDIUM';
    actionWindow = 'Within 7 Days';
  } else {
    urgencyLevel = 'LOW';
    actionWindow = 'Next Scheduled Maintenance Cycle';
  }

  // SHAP-style feature importance, normalised to 100%
  const rawShap = {
    'Track Age / Asset Health': 30 + pastFailureFactor * 15,
    'GMT Traffic Density': 20 + gmtFactor * 15,
    'Past Failure Rate': 15 + pastFailureFactor * 12,
    'Speed Band Risk': 10 + speedFactor * 12,
    'Weather Factor': 8 + weatherFactor * 8
  };
  const shapTotal = Object.values(rawShap).reduce((a, b) => a + b, 0);
  const shapBreakdown = Object.fromEntries(
    Object.entries(rawShap).map(([k, v]) => [k, Number(((v / shapTotal) * 100).toFixed(1))])
  );

  return {
    severityScore: Number(severityScore.toFixed(1)),
    urgencyScore: Number(urgencyScore.toFixed(1)),
    assetImpactScore: Number(assetImpactScore.toFixed(1)),
    trainImpactScore: Number(trainImpactScore.toFixed(1)),
    overdueDaysScore: Number(overdueDaysScore.toFixed(1)),
    priorityScore: Number(priorityScore.toFixed(1)),
    urgencyLevel,
    actionWindow,
    shapBreakdown,
    modelVersion: 'severity-classifier-v2.3 + priority-lgbm-v1.7 (simulated)'
  };
}

/**
 * Outcome Predictor & Cascading Delay Simulator.
 * Given a proposed maintenance block window, estimate the punctuality /
 * train-delay impact and recommend an optimal low-traffic window.
 */
export function predictBlockOutcome(input = {}) {
  const rnd = seededRandom(hashSeed(input.id || input.blockId || 'outcome'));
  const durationHours = Number(input.durationHours || 4);
  const gmt = Number(input.gmt || 30);

  const punctualityImpact = -(0.3 + durationHours * 0.18 + (gmt / 100) * 0.6 + rnd() * 0.4);
  const expressDelayed = Math.max(0, Math.round(durationHours * 0.5 + rnd() * 2));
  const emuLooped = Math.max(0, Math.round(durationHours * 0.3 + rnd() * 2));
  const netDelayMinutes = Math.round(durationHours * 3.5 + rnd() * 8);

  const lowTrafficStart = 1 + Math.floor(rnd() * 2); // 01:00 or 02:00
  const optimalWindow = `${String(lowTrafficStart).padStart(2, '0')}:30 - ${String(
    lowTrafficStart + durationHours
  ).padStart(2, '0')}:${lowTrafficStart % 2 === 0 ? '00' : '30'}`;

  return {
    predictedPunctualityImpact: `${punctualityImpact.toFixed(1)}%`,
    delayedTrainCount: {
      express: expressDelayed,
      emuLocal: emuLooped,
      total: expressDelayed + emuLooped
    },
    netDelayMinutes: `+${netDelayMinutes} mins`,
    recommendation: `Optimal Window Found: ${optimalWindow} (Lowest Passenger Traffic)`,
    modelVersion: 'outcome-predictor-v3.1 (simulated)'
  };
}

/**
 * Simulates realistic ML/GPU inference latency for a given operation.
 */
export function simulateLatency(min = 400, max = 900) {
  const ms = min + Math.random() * (max - min);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default { classifySeverityAndPriority, predictBlockOutcome, simulateLatency };
