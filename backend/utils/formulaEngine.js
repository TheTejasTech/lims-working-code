/** Evaluate parameter formulas using sysCode values */

const evaluateFormula = (formula, values = {}) => {
  if (!formula || !formula.trim()) return null;
  try {
    let expr = formula.trim();
    const assignments = expr.split(';').map((s) => s.trim()).filter(Boolean);
    const scope = { ...values };

    assignments.forEach((part) => {
      if (!part.includes('=')) return;
      const [lhs, rhs] = part.split('=').map((s) => s.trim());
      const evalRhs = rhs.replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, (code) => {
        if (Object.prototype.hasOwnProperty.call(scope, code)) return `(${scope[code]})`;
        return code;
      });
      // eslint-disable-next-line no-new-func
      const val = Function(`"use strict"; return (${evalRhs})`)();
      scope[lhs] = val;
    });

    const last = assignments[assignments.length - 1];
    if (last.includes('=')) return scope[last.split('=')[0].trim()];
    return scope[expr] ?? null;
  } catch {
    return null;
  }
};

const validateAgainstSpec = (result, min, max) => {
  const num = parseFloat(result);
  if (Number.isNaN(num)) return { pass: false, failFlag: true };
  if (min != null && num < min) return { pass: false, failFlag: true };
  if (max != null && num > max) return { pass: false, failFlag: true };
  return { pass: true, failFlag: false };
};

module.exports = { evaluateFormula, validateAgainstSpec };
