import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDirectAuditorProfitability,
  calculateVendorOutsourcedProfitability,
  calculateHybridProfitability,
  calculateGstBreakdown,
  calculateTds,
  validateJournalBalance,
  formatINR,
  formatDateIndian,
} from './rules';

test('Scenario A: Direct auditor assignment calculation matches spec', () => {
  // Spec example: Client rate ₹1,500, Auditor rate ₹1,000, 2 locations = 2 mandays
  const result = calculateDirectAuditorProfitability(2, 1500, 1000, 200);
  assert.equal(result.revenue, 3000);
  assert.equal(result.directCosts, 2000);
  assert.equal(result.grossMargin, 1000);
  assert.equal(result.variableExpenses, 200);
  assert.equal(result.netProfit, 800);
  assert.equal(result.grossMarginPercent, 33.33);
  assert.equal(result.netProfitPercent, 26.67);
});

test('Scenario B: Complete vendor outsourcing calculation matches spec', () => {
  // Spec example: 100 locations, Client rate ₹1,500, Vendor rate ₹1,200
  const result = calculateVendorOutsourcedProfitability(100, 1500, 1200, 4000);
  assert.equal(result.revenue, 150000);
  assert.equal(result.directCosts, 120000);
  assert.equal(result.grossMargin, 30000);
  assert.equal(result.netProfit, 26000);
  assert.equal(result.grossMarginPercent, 20);
});

test('Scenario C: Hybrid execution calculation matches blended rates', () => {
  // Spec example: 20 locations direct @ ₹1,500 client / ₹1,000 auditor
  // 80 locations vendor @ ₹1,500 client / ₹1,200 vendor
  const result = calculateHybridProfitability({
    directMandays: 20,
    directClientRate: 1500,
    auditorRate: 1000,
    vendorMandays: 80,
    vendorClientRate: 1500,
    vendorRate: 1200,
    otherExpenses: 5000,
  });
  // Direct: Rev = 30000, Cost = 20000
  // Vendor: Rev = 120000, Cost = 96000
  // Total Rev = 150000, Total Cost = 116000, GM = 34000, Net = 29000
  assert.equal(result.revenue, 150000);
  assert.equal(result.directCosts, 116000);
  assert.equal(result.grossMargin, 34000);
  assert.equal(result.netProfit, 29000);
});

test('GST breakdown: Intra-state calculates 9% CGST + 9% SGST', () => {
  const intra = calculateGstBreakdown(100000, 'Maharashtra', 'Maharashtra', 18);
  assert.equal(intra.isInterState, false);
  assert.equal(intra.cgstAmount, 9000);
  assert.equal(intra.sgstAmount, 9000);
  assert.equal(intra.igstAmount, 0);
  assert.equal(intra.totalInvoiceAmount, 118000);
});

test('GST breakdown: Inter-state calculates 18% IGST', () => {
  const inter = calculateGstBreakdown(100000, 'Karnataka', 'Maharashtra', 18);
  assert.equal(inter.isInterState, true);
  assert.equal(inter.cgstAmount, 0);
  assert.equal(inter.sgstAmount, 0);
  assert.equal(inter.igstAmount, 18000);
  assert.equal(inter.totalInvoiceAmount, 118000);
});

test('TDS calculation: calculates correct percentage', () => {
  assert.equal(calculateTds(50000, 2), 1000);
  assert.equal(calculateTds(50000, 10), 5000);
});

test('Journal entry double-entry balance validation', () => {
  const balancedLines = [
    { debit: 118000, credit: 0 },
    { debit: 0, credit: 100000 },
    { debit: 0, credit: 18000 },
  ];
  assert.equal(validateJournalBalance(balancedLines).isBalanced, true);
  assert.equal(validateJournalBalance(balancedLines).difference, 0);

  const unbalancedLines = [
    { debit: 100000, credit: 0 },
    { debit: 0, credit: 95000 },
  ];
  assert.equal(validateJournalBalance(unbalancedLines).isBalanced, false);
  assert.equal(validateJournalBalance(unbalancedLines).difference, 5000);
});

test('Indian currency and date formatting', () => {
  assert.equal(formatINR(1500000), '₹15,00,000');
  assert.equal(formatINR(54000), '₹54,000');
  assert.equal(formatDateIndian('2026-11-03'), '03-11-2026');
});
