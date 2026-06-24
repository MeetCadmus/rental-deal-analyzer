import type { Deal, BaseMetrics, YearlyResult, YearRow } from "../types";

// Multi-year projection: cashflow, equity, IRR, total return. Pure.
export function computeYearly(state: Deal, R: BaseMetrics): YearlyResult {
  const { financing, expenses, projection } = state;
  const years = projection.holdYears || 5;
  const rentGrowth = (projection.rentGrowthPct || 0) / 100;
  const vacPct = (expenses.vacancyPct || 0) / 100;
  const vaEnabled = projection.vaEnabled, vaYear = projection.vaYear || 2;
  const vaMonthlyRent = projection.vaMarketRentPerUnit || (R.monRent / R.numU);
  const refiEnabled = projection.refiEnabled, refiYear = projection.refiYear || 3;
  const appPct = (projection.appreciationPct || 0) / 100, price = state.price || 0;
  const exitCapEnabled = projection.exitCapEnabled, exitCap = (projection.exitCapRate || 6) / 100;
  let balance = R.loan, mr = (financing.rate ?? 7.25) / 100 / 12, pmt = R.pmt;
  const origN = (financing.loanYears || 30) * 12;
  let monthsElapsed = 0, cumCF = 0;
  const yearly: YearRow[] = [];
  for (let y = 1; y <= years; y++) {
    let mRent = R.monRent * Math.pow(1 + rentGrowth, y - 1);
    if (vaEnabled && y >= vaYear) mRent = Math.max(mRent, vaMonthlyRent * R.numU);
    const gpiY = mRent * 12, egiY = gpiY * (1 - vacPct) + (R.otherInc || 0) * Math.pow(1 + rentGrowth, y - 1);
    const expY = expenses.mode === "quick" ? egiY * ((expenses.ratio || 45) / 100) : R.totExp * Math.pow(1.02, y - 1);
    const noiY = egiY - expY;
    if (refiEnabled && y === refiYear && balance > 0) {
      const nr = (projection.refiRate || 6.5) / 100 / 12, rem = Math.max(1, origN - monthsElapsed);
      pmt = balance * nr * Math.pow(1 + nr, rem) / (Math.pow(1 + nr, rem) - 1); mr = nr;
    }
    const annDebt = pmt * 12;
    for (let m = 0; m < 12; m++) { const i = balance * mr; balance -= (pmt - i); }
    monthsElapsed += 12;
    const cfY = noiY - annDebt;
    const propVal = exitCapEnabled && exitCap > 0 ? Math.max(0, noiY / exitCap) : price * Math.pow(1 + appPct, y);
    cumCF += cfY;
    yearly.push({
      year: y, monthlyRent: Math.round(mRent / R.numU), gpi: Math.round(gpiY), noi: Math.round(noiY),
      debtService: Math.round(annDebt), cf: Math.round(cfY), propVal: Math.round(propVal),
      balance: Math.round(Math.max(0, balance)), equity: Math.round(propVal - Math.max(0, balance)),
      cumCF: Math.round(cumCF),
    });
  }
  const last = yearly[yearly.length - 1] || ({} as YearRow);
  const sellCostPct = (projection.sellingCostPct ?? 6) / 100;
  const sellProc = (last.propVal || 0) * (1 - sellCostPct) - (last.balance || 0);
  const flows = [-R.cashIn, ...yearly.map((y, i) => (i < years - 1 ? y.cf : y.cf + sellProc))];
  let irr = 0.1;
  for (let i = 0; i < 200; i++) {
    let npv = 0, d = 0;
    flows.forEach((f, j) => { npv += f / Math.pow(1 + irr, j); d -= j * f / Math.pow(1 + irr, j + 1); });
    if (Math.abs(d) < 1e-10) break;
    irr -= npv / d;
    if (irr < -0.99) { irr = -0.99; break; }
  }
  const totCF = yearly.reduce((s, y) => s + y.cf, 0), deprBen = (price * 0.85 / 27.5) * 0.28 * years;
  const appGain = (last.propVal || 0) - price, equityBuild = R.loan - (last.balance || 0);
  const totRet = appGain + equityBuild + totCF + deprBen;
  return { yearly, irr: irr * 100, totCF, deprBen, appGain, equityBuild, totRet, exitVal: last.propVal || 0 };
}
