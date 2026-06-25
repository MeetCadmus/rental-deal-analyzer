// Domain model for a rental deal. Pure data shapes — no React/DOM.

export interface Unit {
  id: number;
  label: string;
  rent: number;
  beds: number;
  bath: number;
  sqft: number;
}

export interface Financing {
  downPct: number;
  rate: number;
  loanYears: number;
  reserveMonths?: number;
}

export interface CustomItem {
  name: string;
  amt: number;
}

export interface Closing {
  mode: "quick" | "detailed";
  quickPct: number;
  origPct: number;
  pointsPct: number;
  appraisal: number;
  creditReport: number;
  underwriting: number;
  transferTaxPct: number;
  attyFee: number;
  titleSearch: number;
  lenderTitle: number;
  ownerTitle: number;
  recordingFees: number;
  firstYearInsurance: number;
  prepaidDays: number;
  taxEscrowMonths: number;
  insEscrowMonths: number;
  inspection: number;
  termite: number;
  survey: number;
  enviro: number;
  customItems: CustomItem[];
}

export interface CustomExpense {
  name: string;
  amt: number;
  period?: "monthly" | "annual";
}

export interface Expenses {
  mode: "quick" | "detailed";
  ratio: number;
  vacancyPct: number;
  taxes: number;
  taxMode?: "fixed" | "pct";
  taxPct?: number;
  insurance: number;
  mgmtPct: number;
  maintenance: number;
  maintMode?: "fixed" | "pct";
  maintPct?: number;
  capex: number;
  capexMode?: "fixed" | "pct";
  capexPct?: number;
  utilities: number;
  landscaping: number;
  accounting: number;
  misc: number;
  customExpenses: CustomExpense[];
  propertyClass?: string;
  v?: number;
}

export interface Projection {
  appreciationPct: number;
  holdYears: number;
  rentGrowthPct: number;
  sellingCostPct: number;
  exitCapEnabled: boolean;
  exitCapRate: number;
  vaEnabled: boolean;
  vaMarketRentPerUnit: number;
  vaYear: number;
  refiEnabled: boolean;
  refiYear: number;
  refiRate: number;
}

export interface Repairs {
  include: boolean;
  unknown: boolean;
  amount: number;
}
export interface Partnership {
  enabled: boolean;
  myPct: number;
}
export interface Comparable {
  [k: string]: unknown;
}

export interface Deal {
  address: string;
  notes: string;
  listingUrl: string;
  insights: unknown;
  aiSource: string;
  aiAt: number;
  price: number;
  otherIncome: number;
  units: Unit[];
  financing: Financing;
  closing: Closing;
  expenses: Expenses;
  projection: Projection;
  repairs: Repairs;
  partnership: Partnership;
  comparables: Comparable[];
  // library metadata (added by makeDeal)
  _id?: string;
  _label?: string;
  _ts?: number;
  _created?: string | number;
}

export type Level = "good" | "warn" | "bad";

export interface ExpenseItems {
  taxes: number;
  insurance: number;
  mgmt: number;
  maint: number;
  capex: number;
  util: number;
  landscape: number;
  acctg: number;
  misc: number;
  custom: number;
}

export interface BaseMetrics {
  gpi: number;
  vacAmt: number;
  otherInc: number;
  egi: number;
  totExp: number;
  expItems: ExpenseItems | null;
  noi: number;
  down: number;
  loan: number;
  pmt: number;
  annPmt: number;
  ccTotal: number;
  repairCost: number;
  cashIn: number;
  pitiMo: number;
  reserveMonths: number;
  reserves: number;
  cashOnHand: number;
  cf: number;
  capRate: number;
  coc: number;
  dscr: number;
  beOcc: number;
  grm: number;
  pct1: number;
  adjThresh: number;
  expRatio: number;
  beRent: number;
  monRent: number;
  numU: number;
  vaEnabled: boolean;
  vaCF: number;
  vaCapRate: number;
  vaCoc: number;
  myCF: number;
  myCoc: number;
  myPct: number;
}

export interface YearRow {
  year: number;
  monthlyRent: number;
  gpi: number;
  noi: number;
  debtService: number;
  cf: number;
  propVal: number;
  balance: number;
  equity: number;
  cumCF: number;
}

export interface YearlyResult {
  yearly: YearRow[];
  irr: number;
  totCF: number;
  deprBen: number;
  appGain: number;
  equityBuild: number;
  totRet: number;
  exitVal: number;
}

export interface DealScore {
  grade: "A" | "B" | "C" | "D" | "—";
  pct: number;
  color: string;
  label: string;
  desc: string;
  metrics: Level[];
  /** True when the deal lacks the inputs needed to score it (no price or no rent). */
  incomplete?: boolean;
}
