/**
 * JaySoftShine Business Logic & Accounting Rules
 */

export interface ProfitabilityCalculation {
  revenue: number;
  directCosts: number;
  variableExpenses: number;
  grossMargin: number;
  grossMarginPercent: number;
  netProfit: number;
  netProfitPercent: number;
}

export function calculateDirectAuditorProfitability(
  approvedMandays: number,
  clientRate: number,
  auditorRate: number,
  additionalExpenses: number = 0
): ProfitabilityCalculation {
  const revenue = approvedMandays * clientRate;
  const directCosts = approvedMandays * auditorRate;
  const grossMargin = revenue - directCosts;
  const netProfit = grossMargin - additionalExpenses;
  const grossMarginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const netProfitPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    directCosts,
    variableExpenses: additionalExpenses,
    grossMargin,
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    netProfit,
    netProfitPercent: Number(netProfitPercent.toFixed(2)),
  };
}

export function calculateVendorOutsourcedProfitability(
  approvedMandays: number,
  clientRate: number,
  vendorRate: number,
  additionalExpenses: number = 0
): ProfitabilityCalculation {
  const revenue = approvedMandays * clientRate;
  const directCosts = approvedMandays * vendorRate;
  const grossMargin = revenue - directCosts;
  const netProfit = grossMargin - additionalExpenses;
  const grossMarginPercent = revenue > 0 ? (grossMargin / revenue) * 100 : 0;
  const netProfitPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    revenue,
    directCosts,
    variableExpenses: additionalExpenses,
    grossMargin,
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    netProfit,
    netProfitPercent: Number(netProfitPercent.toFixed(2)),
  };
}

export function calculateHybridProfitability(params: {
  directMandays: number;
  directClientRate: number;
  auditorRate: number;
  vendorMandays: number;
  vendorClientRate: number;
  vendorRate: number;
  otherExpenses: number;
}): ProfitabilityCalculation {
  const directRevenue = params.directMandays * params.directClientRate;
  const vendorRevenue = params.vendorMandays * params.vendorClientRate;
  const totalRevenue = directRevenue + vendorRevenue;

  const directCost = params.directMandays * params.auditorRate;
  const vendorCost = params.vendorMandays * params.vendorRate;
  const totalDirectCosts = directCost + vendorCost;

  const grossMargin = totalRevenue - totalDirectCosts;
  const netProfit = grossMargin - params.otherExpenses;
  const grossMarginPercent = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const netProfitPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    revenue: totalRevenue,
    directCosts: totalDirectCosts,
    variableExpenses: params.otherExpenses,
    grossMargin,
    grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
    netProfit,
    netProfitPercent: Number(netProfitPercent.toFixed(2)),
  };
}

export interface GstTaxBreakdown {
  taxableAmount: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalInvoiceAmount: number;
}

export function calculateGstBreakdown(
  taxableAmount: number,
  clientState: string,
  companyState: string = 'Maharashtra',
  gstRate: number = 18
): GstTaxBreakdown {
  const isInterState = clientState.trim().toLowerCase() !== companyState.trim().toLowerCase();

  if (isInterState) {
    const igstAmount = Math.round((taxableAmount * gstRate) / 100);
    return {
      taxableAmount,
      isInterState: true,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: gstRate,
      igstAmount,
      totalTax: igstAmount,
      totalInvoiceAmount: taxableAmount + igstAmount,
    };
  } else {
    const halfRate = gstRate / 2;
    const cgstAmount = Math.round((taxableAmount * halfRate) / 100);
    const sgstAmount = Math.round((taxableAmount * halfRate) / 100);
    return {
      taxableAmount,
      isInterState: false,
      cgstRate: halfRate,
      cgstAmount,
      sgstRate: halfRate,
      sgstAmount,
      igstRate: 0,
      igstAmount: 0,
      totalTax: cgstAmount + sgstAmount,
      totalInvoiceAmount: taxableAmount + cgstAmount + sgstAmount,
    };
  }
}

export function calculateTds(amount: number, ratePercent: number): number {
  return Math.round((amount * ratePercent) / 100);
}

export function validateJournalBalance(lines: { debit: number; credit: number }[]): {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
} {
  const totalDebit = lines.reduce((acc, curr) => acc + (curr.debit || 0), 0);
  const totalCredit = lines.reduce((acc, curr) => acc + (curr.credit || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  return {
    isBalanced: difference === 0,
    totalDebit,
    totalCredit,
    difference,
  };
}

export function formatINR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '₹0';
  const isNegative = val < 0;
  const absVal = Math.abs(Math.round(val));
  const s = absVal.toString();
  let lastThree = s.substring(s.length - 3);
  const otherNumbers = s.substring(0, s.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${res}`;
}

export function formatDateIndian(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return isoDateString;
  }
}

export function formatTimeIndian(isoDateString?: string): string {
  if (!isoDateString) return '-';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return '-';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm} IST`;
  } catch {
    return '-';
  }
}
