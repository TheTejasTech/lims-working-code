const calcGst = (taxableAmount, customerState, companyState = process.env.COMPANY_STATE || 'Maharashtra', gstPercent = 18, sezApplicable = false) => {
  if (sezApplicable) {
    return { sgst: 0, cgst: 0, igst: 0, notApplicable: true, totalTax: 0 };
  }

  const amount = Number(taxableAmount) || 0;
  const rate = Number(gstPercent) / 100;
  const totalTax = amount * rate;

  const isIntraState =
    customerState &&
    companyState &&
    customerState.trim().toLowerCase() === companyState.trim().toLowerCase();

  if (isIntraState) {
    return {
      sgst: totalTax / 2,
      cgst: totalTax / 2,
      igst: 0,
      notApplicable: false,
      totalTax,
    };
  }

  return {
    sgst: 0,
    cgst: 0,
    igst: totalTax,
    notApplicable: false,
    totalTax,
  };
};

module.exports = { calcGst };
