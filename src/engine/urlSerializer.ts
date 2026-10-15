import type { SimulationInputs } from '../types/loan';

export function serializeSimulationState(inputs: SimulationInputs): string {
  try {
    const compactPayload = {
      p: inputs.principal,
      t: inputs.tenureYears,
      sd: inputs.startDate,
      m: inputs.mode,
      c: inputs.currencyCode,
      lp: inputs.lockInPhases.map((phase) => ({
        n: phase.name,
        d: phase.durationYears,
        r: phase.ratePercent,
      })),
      fr: inputs.fallbackRatePercent,
      fa: inputs.fallbackYoYAdjustment,
      bs: inputs.baselineMonthlySurplus,
      msd: inputs.monthlySurplusStartDate,
      ot: inputs.oneTimeTransactions,
      cs: inputs.customSurplusLedger,
      sc: inputs.salaryCycle,
    };

    const json = JSON.stringify(compactPayload);
    return btoa(encodeURIComponent(json));
  } catch (err) {
    console.error('Failed to serialize simulation state', err);
    return '';
  }
}

export function deserializeSimulationState(encoded: string): Partial<SimulationInputs> | null {
  try {
    if (!encoded) return null;
    const json = decodeURIComponent(atob(encoded));
    const data = JSON.parse(json);

    return {
      principal: data.p,
      tenureYears: data.t,
      startDate: data.sd,
      mode: data.m,
      currencyCode: data.c,
      lockInPhases: Array.isArray(data.lp)
        ? data.lp.map((phase: { n: string; d: number; r: number }, idx: number) => ({
            id: `phase-${idx + 1}`,
            name: phase.n,
            durationYears: phase.d,
            ratePercent: phase.r,
          }))
        : undefined,
      fallbackRatePercent: data.fr,
      fallbackYoYAdjustment: data.fa,
      baselineMonthlySurplus: data.bs,
      monthlySurplusStartDate: data.msd,
      oneTimeTransactions: Array.isArray(data.ot) ? data.ot : [],
      customSurplusLedger: data.cs || {},
      salaryCycle: data.sc,
    };
  } catch (err) {
    console.error('Failed to deserialize simulation state', err);
    return null;
  }
}

export async function copyShareableLink(inputs: SimulationInputs): Promise<boolean> {
  try {
    const hash = serializeSimulationState(inputs);
    const url = new URL(window.location.href);
    url.hash = `share=${hash}`;
    await navigator.clipboard.writeText(url.toString());
    return true;
  } catch {
    return false;
  }
}
