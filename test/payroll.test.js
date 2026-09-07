import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateOntarioIncomeTax, calculateTakeHomePay, isOntarioTimeZone } from '../src/lib/payroll.js';

test('identifies the Ontario time zone', () => {
  assert.equal(isOntarioTimeZone('America/Toronto'), true);
});

test('does not treat other Canadian time zones as Ontario', () => {
  assert.equal(isOntarioTimeZone('America/Vancouver'), false);
});

test('calculates zero Ontario tax below the basic personal amount', () => {
  assert.equal(calculateOntarioIncomeTax(12_000), 0);
});

test('calculates a progressive Ontario and federal tax estimate', () => {
  const estimate = calculateTakeHomePay(60_000, 0, true);
  assert.ok(estimate.ontarioTax > 2_000);
  assert.ok(estimate.federalTax > 6_000);
  assert.equal(estimate.takeHome, estimate.gross - estimate.totalTax);
});

test('keeps gross pay when tax calculation is disabled', () => {
  const estimate = calculateTakeHomePay(60_000, 0, false);
  assert.equal(estimate.totalTax, 0);
  assert.equal(estimate.takeHome, 60_000);
});

test('includes each custom tax row in the total', () => {
  const estimate = calculateTakeHomePay(60_000, [2, 1.5], true);
  assert.equal(estimate.extraTax, 2_100);
});

test('includes CPP, EI, and long-term disability deductions from the pay-stub profile', () => {
  const estimate = calculateTakeHomePay(60_000, [], true);
  assert.ok(estimate.cpp > 3_400);
  assert.ok(estimate.ei > 900);
  assert.ok(estimate.longTermDisability > 800);
});

test('omits an unchecked default deduction from the total', () => {
  const allDeductions = calculateTakeHomePay(60_000, [], true);
  const withoutCpp = calculateTakeHomePay(60_000, [], true, { cpp: false });
  assert.ok(Math.abs((allDeductions.totalTax - withoutCpp.totalTax) - allDeductions.cpp) < 0.001);
});
