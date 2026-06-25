import type { Closing, Expenses, Deal } from "./types";

export const DCC: Closing = {
  mode: "quick",
  quickPct: 3,
  origPct: 0.5,
  pointsPct: 0,
  appraisal: 800,
  creditReport: 30,
  underwriting: 750,
  transferTaxPct: 0,
  attyFee: 1200,
  titleSearch: 275,
  lenderTitle: 900,
  ownerTitle: 1200,
  recordingFees: 75,
  firstYearInsurance: 1500,
  prepaidDays: 15,
  taxEscrowMonths: 3,
  insEscrowMonths: 2,
  inspection: 550,
  termite: 100,
  survey: 600,
  enviro: 0,
  customItems: [],
};

// Itemized expenses are all stored as ANNUAL dollars (v:2).
export const DEX: Expenses = {
  mode: "quick",
  ratio: 45,
  vacancyPct: 5.5,
  taxes: 7800,
  taxMode: "fixed",
  taxPct: 1.2,
  insurance: 4600,
  mgmtPct: 8,
  maintenance: 6000,
  maintMode: "fixed",
  capex: 6000,
  capexMode: "fixed",
  utilities: 1800,
  landscaping: 1200,
  accounting: 800,
  misc: 500,
  customExpenses: [],
  propertyClass: "B",
  v: 2,
};

export interface ClassPreset {
  ratio: number;
  maintenance: number;
  capex: number;
  insurance: number;
  label: string;
  hint: string;
}
export const CLASS_PRESETS: Record<string, ClassPreset> = {
  new: { ratio: 35, maintenance: 75, capex: 150, insurance: 1200, label: "New build", hint: "<2yr, minimal issues" },
  B: { ratio: 45, maintenance: 250, capex: 400, insurance: 1300, label: "B-class", hint: "10–25yr" },
  C: { ratio: 52, maintenance: 350, capex: 500, insurance: 1800, label: "C-class", hint: "Old stock" },
  fixer: { ratio: 55, maintenance: 450, capex: 600, insurance: 2000, label: "Fixer-upper", hint: "Needs rehab" },
};

export const INIT: Deal = {
  address: "",
  notes: "",
  listingUrl: "",
  insights: null,
  aiSource: "",
  aiAt: 0,
  price: 620000,
  otherIncome: 0,
  units: [
    { id: 1, label: "Unit 1", rent: 1550, beds: 2, bath: 1, sqft: 900 },
    { id: 2, label: "Unit 2", rent: 1550, beds: 2, bath: 1, sqft: 900 },
    { id: 3, label: "Unit 3", rent: 1150, beds: 1, bath: 1, sqft: 650 },
    { id: 4, label: "Unit 4", rent: 1150, beds: 1, bath: 1, sqft: 650 },
  ],
  financing: { downPct: 25, rate: 7.25, loanYears: 30, reserveMonths: 0 },
  closing: { ...DCC },
  expenses: { ...DEX },
  projection: {
    appreciationPct: 4.5,
    holdYears: 5,
    rentGrowthPct: 3,
    sellingCostPct: 6,
    exitCapEnabled: false,
    exitCapRate: 6,
    vaEnabled: false,
    vaMarketRentPerUnit: 1750,
    vaYear: 2,
    refiEnabled: false,
    refiYear: 3,
    refiRate: 6.5,
  },
  repairs: { include: false, unknown: false, amount: 0 },
  partnership: { enabled: false, myPct: 60 },
  comparables: [],
};

// Genuinely empty deal for "+ New deal": keeps sensible financing/expense defaults but
// zeroes property-specific fields so nothing misleads you or the AI prompt.
export const BLANK: Deal = {
  ...INIT,
  price: 0,
  address: "",
  notes: "",
  listingUrl: "",
  insights: null,
  comparables: [],
  units: [{ id: 1, label: "Unit 1", rent: 0, beds: 0, bath: 0, sqft: 0 }],
};
