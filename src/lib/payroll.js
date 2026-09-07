const ONTARIO_BRACKETS = [
  [52_886, 0.0505],
  [105_775, 0.0915],
  [150_000, 0.1116],
  [220_000, 0.1216],
  [Infinity, 0.1316],
];

const FEDERAL_BRACKETS = [
  [57_375, 0.15],
  [114_750, 0.205],
  [177_882, 0.26],
  [253_414, 0.29],
  [Infinity, 0.33],
];

// Rates are derived from the current-pay deductions in the supplied statement.
const PAY_STUB_RATES = {
  cpp: 0.05807,
  ei: 0.0166,
  longTermDisability: 0.01355,
};

const progressiveTax = (income, brackets) => {
  let tax = 0;
  let lowerBound = 0;

  brackets.forEach(([upperBound, rate]) => {
    tax += Math.max(0, Math.min(income, upperBound) - lowerBound) * rate;
    lowerBound = upperBound;
  });

  return tax;
};

export const isOntarioTimeZone = (timeZone) => timeZone === 'America/Toronto';

export const calculateOntarioIncomeTax = (income) => {
  const basicPersonalAmount = 12_747;
  return Math.max(0, progressiveTax(income, ONTARIO_BRACKETS) - basicPersonalAmount * 0.0505);
};

export const calculateFederalIncomeTax = (income) => {
  const basicPersonalAmount = 16_129;
  return Math.max(0, progressiveTax(income, FEDERAL_BRACKETS) - basicPersonalAmount * 0.15);
};

export const calculateTakeHomePay = (gross, extraTaxRates, shouldCalculateTax, includedDeductions = {}) => {
  if (!shouldCalculateTax) return { gross, federalTax: 0, ontarioTax: 0, cpp: 0, ei: 0, longTermDisability: 0, extraTax: 0, totalTax: 0, takeHome: gross };

  const federalTax = calculateFederalIncomeTax(gross);
  const ontarioTax = calculateOntarioIncomeTax(gross);
  const cpp = gross * PAY_STUB_RATES.cpp;
  const ei = gross * PAY_STUB_RATES.ei;
  const longTermDisability = gross * PAY_STUB_RATES.longTermDisability;
  const taxRates = Array.isArray(extraTaxRates) ? extraTaxRates : [extraTaxRates];
  const extraTax = taxRates.reduce((total, rate) => total + gross * Math.max(0, rate) / 100, 0);
  const included = { incomeTax: true, cpp: true, ei: true, longTermDisability: true, ...includedDeductions };
  const totalTax =
    (included.incomeTax ? federalTax + ontarioTax : 0) +
    (included.cpp ? cpp : 0) +
    (included.ei ? ei : 0) +
    (included.longTermDisability ? longTermDisability : 0) +
    extraTax;
  return { gross, federalTax, ontarioTax, cpp, ei, longTermDisability, extraTax, totalTax, takeHome: Math.max(0, gross - totalTax) };
};
