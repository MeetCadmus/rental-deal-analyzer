import { calcExp } from "./expenses";
import { calcCC } from "./closing";
import type { Deal, BaseMetrics } from "../types";

// Year-1 underwriting metrics for a deal. Pure.
export function computeBase(state: Deal): BaseMetrics {
  const { units, financing, closing, expenses, projection, repairs } = state;
  const gpi = units.reduce((s, u) => s + u.rent, 0) * 12;
  const vacAmt = gpi * ((expenses.vacancyPct || 0) / 100);
  const otherInc = (state.otherIncome || 0) * 12; // laundry/parking/pet/storage etc.
  const egi = gpi - vacAmt + otherInc;
  const price = state.price || 0;
  const { totExp, items: expItems } = calcExp(expenses, units.length, egi, price);
  const noi = egi - totExp;
  const down = price * (financing.downPct ?? 25) / 100;
  const loan = price - down;
  const mr = (financing.rate ?? 7.25) / 100 / 12;
  const n = (financing.loanYears || 30) * 12;
  const pmt = mr === 0 ? loan / n : loan * mr * Math.pow(1 + mr, n) / (Math.pow(1 + mr, n) - 1);
  const annPmt = pmt * 12;
  const ccTotal = calcCC(closing, price, loan, expenses.taxes || 0, expenses.insurance || 0, financing.rate ?? 7.25);
  const repairCost = repairs.include && !repairs.unknown ? (repairs.amount || 0) : 0;
  const cashIn = down + ccTotal + repairCost;
  const pitiMo = pmt + ((expenses.taxes || 0) + (expenses.insurance || 0)) / 12;
  const reserveMonths = financing.reserveMonths || 0;
  const reserves = reserveMonths * pitiMo;
  const cashOnHand = cashIn + reserves;
  const cf = noi - annPmt;
  const capRate = price > 0 ? (noi / price) * 100 : 0;
  const coc = cashIn > 0 ? (cf / cashIn) * 100 : 0;
  const dscr = annPmt > 0 ? noi / annPmt : 0;
  const beOcc = gpi > 0 ? ((totExp + annPmt) / gpi) * 100 : 0;
  const grm = gpi > 0 ? price / gpi : 0;
  const monRent = units.reduce((s, u) => s + u.rent, 0);
  const pct1 = price > 0 ? (monRent / price) * 100 : 0;
  const adjThresh = price > 800000 ? 0.65 : price > 500000 ? 0.75 : price > 300000 ? 0.85 : 1.0;
  const expRatio = egi > 0 ? (totExp / egi) * 100 : 0;
  const numU = Math.max(units.length, 1);
  const beRent = numU > 0 && (1 - (expenses.vacancyPct || 0) / 100) > 0
    ? (totExp + annPmt) / (numU * 12 * (1 - (expenses.vacancyPct || 0) / 100)) : 0;
  // Value-add
  const vaEnabled = projection.vaEnabled;
  const vaMonthlyRent = projection.vaMarketRentPerUnit || (monRent / numU);
  const vaGPI = (vaMonthlyRent * numU) * 12, vaEGI = vaGPI * (1 - (expenses.vacancyPct || 0) / 100);
  const { totExp: vaExp } = calcExp(expenses, numU, vaEGI, price);
  const vaNOI = vaEGI - vaExp, vaCF = vaNOI - annPmt;
  const vaCapRate = price > 0 ? (vaNOI / price) * 100 : 0, vaCoc = cashIn > 0 ? (vaCF / cashIn) * 100 : 0;
  // Partnership
  const myPct = (state.partnership?.myPct || 100) / 100;
  const myCF = cf * myPct, myCoc = cashIn > 0 ? (myCF / cashIn) * 100 : 0;
  return {
    gpi, vacAmt, otherInc, egi, totExp, expItems, noi, down, loan, pmt, annPmt, ccTotal, repairCost,
    cashIn, pitiMo, reserveMonths, reserves, cashOnHand, cf, capRate, coc, dscr, beOcc, grm, pct1,
    adjThresh, expRatio, beRent, monRent, numU, vaEnabled, vaCF, vaCapRate, vaCoc, myCF, myCoc, myPct,
  };
}
