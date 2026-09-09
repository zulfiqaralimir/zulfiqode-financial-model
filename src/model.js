// Pure calculation engine for the ZulfiQode 3-year financial model.
// No UI imports here — this module only computes numbers.

export const defaultAssumptions = {
  fxRate: 280,
  corporate: {
    yearEndCounts: [3, 8, 18],
    acvYear1: 8000000,
    acvEscalation: 0.1,
  },
  saas: {
    yearEndCounts: [0, 60, 300],
    priceYear2: 45000,
    priceEscalationY3: 0.05,
  },
  cogs: {
    infraPerClientYear1: 50000,
    infraEscalation: 0.05,
    hostPerSubYear1: 2000,
    hostPerSubYear3: 2100,
  },
  opex: {
    marketingPct: 0.08,
    gaYear1: 300000,
    gaEscalation: 0.1,
    badDebtPct: 0.02,
  },
  workingCapital: { dso: 30, dpo: 20 },
  tax: { rate: 0.29 },
  team: [
    { name: "Founder / CEO", headcount: [1, 1, 1], salaryYear1: 400000, escalation: 0.1 },
    { name: "Quant / AI Engineer", headcount: [1, 2, 3], salaryYear1: 300000, escalation: 0.1 },
    { name: "Backend / Data Engineer", headcount: [1, 2, 3], salaryYear1: 250000, escalation: 0.1 },
    { name: "Sales & BD Lead", headcount: [0, 1, 2], salaryYear1: 200000, escalation: 0.1 },
    { name: "Ops / Admin", headcount: [1, 1, 1], salaryYear1: 100000, escalation: 0.1 },
  ],
  capex: [
    { name: "Laptops & Equipment — Year 1 team", month: 1, price: 1000000, life: 36 },
    { name: "GPU / AI Workstation", month: 1, price: 1500000, life: 36 },
    { name: "Office Setup & Furniture", month: 1, price: 500000, life: 60 },
    { name: "Laptops & Equipment — Year 2 additions", month: 13, price: 750000, life: 36 },
    { name: "Laptops & Equipment — Year 3 additions", month: 25, price: 750000, life: 36 },
  ],
  financing: { paidInCapital: 10000000 },
};

const YEAR_BOUNDARIES = [0, 12, 24, 36];

// Linear interpolation between cumulative year-end targets (0 at month 0).
function rampValue(month, yearEndCounts) {
  const targets = [0, yearEndCounts[0], yearEndCounts[1], yearEndCounts[2]];
  let yearIdx = Math.min(2, Math.floor((month - 1) / 12));
  const startMonth = YEAR_BOUNDARIES[yearIdx];
  const endMonth = YEAR_BOUNDARIES[yearIdx + 1];
  const startVal = targets[yearIdx];
  const endVal = targets[yearIdx + 1];
  const frac = (month - startMonth) / (endMonth - startMonth);
  return startVal + (endVal - startVal) * frac;
}

function yearIndexForMonth(month) {
  return Math.min(2, Math.floor((month - 1) / 12));
}

function escalate(base, rate, yearIdx) {
  return base * Math.pow(1 + rate, yearIdx);
}

export function computeModel(assumptions) {
  const {
    corporate,
    saas,
    cogs,
    opex,
    workingCapital,
    tax,
    team,
    capex,
    financing,
  } = assumptions;

  const months = [];

  let prevAR = 0;
  let prevAP = 0;
  let cash = 0;
  let cumulativeNetProfit = 0;
  let breakevenMonth = null;

  for (let month = 1; month <= 36; month++) {
    const yearIdx = yearIndexForMonth(month);

    // 1. Client / subscriber ramp
    const corporateClients = rampValue(month, corporate.yearEndCounts);
    const saasSubs = rampValue(month, saas.yearEndCounts);

    // 2. Revenue
    const acv = escalate(corporate.acvYear1, corporate.acvEscalation, yearIdx);
    const corporateRevenue = corporateClients * (acv / 12);

    let saasPrice = 0;
    if (yearIdx === 1) saasPrice = saas.priceYear2;
    else if (yearIdx === 2) saasPrice = saas.priceYear2 * (1 + saas.priceEscalationY3);
    const saasRevenue = saasSubs * saasPrice;

    const revenue = corporateRevenue + saasRevenue;

    // 3. COGS
    const infraPerClient = escalate(cogs.infraPerClientYear1, cogs.infraEscalation, yearIdx);
    const infraCost = corporateClients * infraPerClient;

    let hostPerSub = cogs.hostPerSubYear1;
    if (yearIdx === 2) hostPerSub = cogs.hostPerSubYear3;
    const hostingCost = saasSubs * hostPerSub;

    const totalCogs = infraCost + hostingCost;
    const grossProfit = revenue - totalCogs;

    // 4. OpEx
    const marketing = revenue * opex.marketingPct;

    let salary = 0;
    for (const role of team) {
      const headcount = role.headcount[yearIdx];
      const monthlySalary = escalate(role.salaryYear1, role.escalation, yearIdx);
      salary += headcount * monthlySalary;
    }

    const ga = escalate(opex.gaYear1, opex.gaEscalation, yearIdx);
    const badDebt = corporateRevenue * opex.badDebtPct;

    let depreciation = 0;
    for (const asset of capex) {
      const inServiceStart = asset.month;
      const inServiceEnd = asset.month + asset.life - 1;
      if (month >= inServiceStart && month <= inServiceEnd) {
        depreciation += asset.price / asset.life;
      }
    }

    const totalOpex = marketing + salary + ga + badDebt + depreciation;

    // 5. Profit
    const pbt = grossProfit - totalOpex;
    const taxAmount = pbt > 0 ? pbt * tax.rate : 0;
    const netProfit = pbt - taxAmount;
    cumulativeNetProfit += netProfit;

    if (breakevenMonth === null && pbt > 0) {
      breakevenMonth = month;
    }

    // 6. Balance sheet drivers
    const accountsReceivable = revenue * (workingCapital.dso / 30);
    const accountsPayable = totalCogs * (workingCapital.dpo / 30);

    let grossCapexToDate = 0;
    let accumulatedDepreciation = 0;
    for (const asset of capex) {
      if (asset.month <= month) {
        grossCapexToDate += asset.price;
        const monthsInService = Math.min(month - asset.month + 1, asset.life);
        accumulatedDepreciation += (asset.price / asset.life) * monthsInService;
      }
    }
    const equipmentNBV = grossCapexToDate - accumulatedDepreciation;

    // 7. Cashflow (indirect method)
    const arChange = accountsReceivable - prevAR;
    const apChange = accountsPayable - prevAP;
    const operatingCash = netProfit + depreciation - arChange + apChange;

    let capexSpend = 0;
    for (const asset of capex) {
      if (asset.month === month) capexSpend += asset.price;
    }
    const investingCash = -capexSpend;

    const financingCash = month === 1 ? financing.paidInCapital : 0;

    const netChange = operatingCash + investingCash + financingCash;
    cash += netChange;

    months.push({
      month,
      year: yearIdx + 1,
      corporateClients,
      saasSubs,
      corporateRevenue,
      saasRevenue,
      revenue,
      infraCost,
      hostingCost,
      totalCogs,
      grossProfit,
      marketing,
      salary,
      ga,
      badDebt,
      depreciation,
      totalOpex,
      pbt,
      tax: taxAmount,
      netProfit,
      accountsReceivable,
      accountsPayable,
      equipmentNBV,
      operatingCash,
      investingCash,
      financingCash,
      netChange,
      cash,
      cumulativeNetProfit,
    });

    prevAR = accountsReceivable;
    prevAP = accountsPayable;
  }

  // Annual roll-ups
  const annual = [1, 2, 3].map((yr) => {
    const yearMonths = months.filter((m) => m.year === yr);
    const sum = (key) => yearMonths.reduce((acc, m) => acc + m[key], 0);
    const last = yearMonths[yearMonths.length - 1];
    return {
      year: yr,
      revenue: sum("revenue"),
      totalCogs: sum("totalCogs"),
      grossProfit: sum("grossProfit"),
      totalOpex: sum("totalOpex"),
      netProfit: sum("netProfit"),
      endingCash: last.cash,
      corporateClients: last.corporateClients,
      saasSubs: last.saasSubs,
    };
  });

  const totalRevenue3yr = months.reduce((acc, m) => acc + m.revenue, 0);
  const totalNetProfit3yr = months.reduce((acc, m) => acc + m.netProfit, 0);
  const endingCash = months[months.length - 1].cash;
  const lowestCash = Math.min(...months.map((m) => m.cash));
  const corporateClientsYr3 = months[months.length - 1].corporateClients;
  const saasSubsYr3 = months[months.length - 1].saasSubs;

  return {
    months,
    annual,
    dashboard: {
      totalRevenue3yr,
      totalNetProfit3yr,
      endingCash,
      lowestCash,
      breakevenMonth,
      corporateClientsYr3,
      saasSubsYr3,
    },
  };
}
