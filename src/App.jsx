import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { defaultAssumptions, computeModel } from "./model.js";

// ---------- formatting helpers ----------

function formatFull(n) {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  return `${sign}₨${abs.toLocaleString("en-IN")}`;
}

function formatCompact(n) {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 10000000) return `${sign}₨${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₨${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₨${(abs / 1000).toFixed(1)}K`;
  return `${sign}₨${Math.round(abs)}`;
}

function formatNumber(n) {
  return Math.round(n).toLocaleString("en-IN");
}

function signClass(n) {
  return n > 0 ? "positive" : n < 0 ? "negative" : "";
}

// ---------- deep update helper ----------

function setPath(obj, path, value) {
  const clone = structuredClone(obj);
  let cur = clone;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
  return clone;
}

function NumberField({ label, value, onChange, step = "any", suffix }) {
  return (
    <div className="field">
      <label>
        {label}
        {suffix ? ` (${suffix})` : ""}
      </label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
      />
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  return (
    <details className="assumption-group" open={defaultOpen}>
      <summary>{title}</summary>
      <div className="assumption-body">{children}</div>
    </details>
  );
}

function KpiCard({ label, value, colorClass, small }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div
        className={`kpi-value mono ${colorClass || ""} ${small ? "small" : ""}`}
        title={formatFull(value)}
      >
        {typeof value === "number" ? formatCompact(value) : value}
      </div>
    </div>
  );
}

function Row({ label, values, variant, colorize }) {
  return (
    <tr className={variant ? `${variant}-row` : ""}>
      <td>{label}</td>
      {values.map((v, i) => (
        <td key={i} className={colorize ? signClass(v) : ""}>
          {formatFull(v)}
        </td>
      ))}
    </tr>
  );
}

function SectionRow({ label, span }) {
  return (
    <tr className="section-row">
      <td colSpan={span}>{label}</td>
    </tr>
  );
}

function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="tt-label">Month {label}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

const STATEMENT_TABS = [
  { key: "summary", label: "Annual Summary" },
  { key: "income", label: "Income Statement" },
  { key: "balance", label: "Balance Sheet" },
  { key: "cashflow", label: "Cash Flow Statement" },
  { key: "salary", label: "Salary Schedule" },
  { key: "depreciation", label: "Depreciation Schedule" },
];

export default function App() {
  const [assumptions, setAssumptions] = useState(defaultAssumptions);
  const [statementTab, setStatementTab] = useState("summary");

  const result = useMemo(() => computeModel(assumptions), [assumptions]);
  const { dashboard, annual, months, salarySchedule, depreciationSchedule } = result;

  const update = (path) => (value) => setAssumptions((prev) => setPath(prev, path, value));

  const annualYears = [0, 1, 2];
  const cols = [annual[0], annual[1], annual[2]];
  const v = (key) => cols.map((c) => c[key]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p className="sidebar-title">Live Assumptions</p>
        <p className="sidebar-subtitle">
          Adjust any input — the model recalculates instantly across all 36 months.
        </p>

        <Section title="Corporate Clients" defaultOpen>
          <div className="field-row">
            <NumberField
              label="Yr1 end"
              value={assumptions.corporate.yearEndCounts[0]}
              onChange={update(["corporate", "yearEndCounts", 0])}
            />
            <NumberField
              label="Yr2 end"
              value={assumptions.corporate.yearEndCounts[1]}
              onChange={update(["corporate", "yearEndCounts", 1])}
            />
            <NumberField
              label="Yr3 end"
              value={assumptions.corporate.yearEndCounts[2]}
              onChange={update(["corporate", "yearEndCounts", 2])}
            />
          </div>
          <NumberField
            label="ACV Year 1"
            suffix="PKR/yr"
            value={assumptions.corporate.acvYear1}
            onChange={update(["corporate", "acvYear1"])}
          />
          <NumberField
            label="ACV escalation"
            suffix="per year"
            step="0.01"
            value={assumptions.corporate.acvEscalation}
            onChange={update(["corporate", "acvEscalation"])}
          />
        </Section>

        <Section title="SaaS Subscribers">
          <div className="field-row">
            <NumberField
              label="Yr1 end"
              value={assumptions.saas.yearEndCounts[0]}
              onChange={update(["saas", "yearEndCounts", 0])}
            />
            <NumberField
              label="Yr2 end"
              value={assumptions.saas.yearEndCounts[1]}
              onChange={update(["saas", "yearEndCounts", 1])}
            />
            <NumberField
              label="Yr3 end"
              value={assumptions.saas.yearEndCounts[2]}
              onChange={update(["saas", "yearEndCounts", 2])}
            />
          </div>
          <NumberField
            label="Price Year 2"
            suffix="PKR/mo"
            value={assumptions.saas.priceYear2}
            onChange={update(["saas", "priceYear2"])}
          />
          <NumberField
            label="Price escalation Y3"
            step="0.01"
            value={assumptions.saas.priceEscalationY3}
            onChange={update(["saas", "priceEscalationY3"])}
          />
        </Section>

        <Section title="Cost of Revenue">
          <NumberField
            label="Infra / client Yr1"
            suffix="PKR/mo"
            value={assumptions.cogs.infraPerClientYear1}
            onChange={update(["cogs", "infraPerClientYear1"])}
          />
          <NumberField
            label="Infra escalation"
            step="0.01"
            value={assumptions.cogs.infraEscalation}
            onChange={update(["cogs", "infraEscalation"])}
          />
          <NumberField
            label="Hosting / sub Yr1-2"
            suffix="PKR/mo"
            value={assumptions.cogs.hostPerSubYear1}
            onChange={update(["cogs", "hostPerSubYear1"])}
          />
          <NumberField
            label="Hosting / sub Yr3"
            suffix="PKR/mo"
            value={assumptions.cogs.hostPerSubYear3}
            onChange={update(["cogs", "hostPerSubYear3"])}
          />
        </Section>

        <Section title="Operating Expenses">
          <NumberField
            label="Marketing"
            suffix="% of revenue"
            step="0.01"
            value={assumptions.opex.marketingPct}
            onChange={update(["opex", "marketingPct"])}
          />
          <NumberField
            label="G&A Year 1"
            suffix="PKR/mo"
            value={assumptions.opex.gaYear1}
            onChange={update(["opex", "gaYear1"])}
          />
          <NumberField
            label="G&A escalation"
            step="0.01"
            value={assumptions.opex.gaEscalation}
            onChange={update(["opex", "gaEscalation"])}
          />
          <NumberField
            label="Bad debt"
            suffix="% of corp revenue"
            step="0.01"
            value={assumptions.opex.badDebtPct}
            onChange={update(["opex", "badDebtPct"])}
          />
        </Section>

        <Section title="Working Capital & Tax">
          <NumberField
            label="DSO"
            suffix="days"
            value={assumptions.workingCapital.dso}
            onChange={update(["workingCapital", "dso"])}
          />
          <NumberField
            label="DPO"
            suffix="days"
            value={assumptions.workingCapital.dpo}
            onChange={update(["workingCapital", "dpo"])}
          />
          <NumberField
            label="Tax rate"
            step="0.01"
            value={assumptions.tax.rate}
            onChange={update(["tax", "rate"])}
          />
        </Section>

        <Section title="Team & Salaries">
          {assumptions.team.map((role, idx) => (
            <div className="role-block" key={role.name}>
              <div className="role-name">{role.name}</div>
              <div className="field-row">
                <NumberField
                  label="Yr1 HC"
                  value={role.headcount[0]}
                  onChange={update(["team", idx, "headcount", 0])}
                />
                <NumberField
                  label="Yr2 HC"
                  value={role.headcount[1]}
                  onChange={update(["team", idx, "headcount", 1])}
                />
                <NumberField
                  label="Yr3 HC"
                  value={role.headcount[2]}
                  onChange={update(["team", idx, "headcount", 2])}
                />
              </div>
              <NumberField
                label="Salary Yr1"
                suffix="PKR/mo"
                value={role.salaryYear1}
                onChange={update(["team", idx, "salaryYear1"])}
              />
              <NumberField
                label="Escalation"
                step="0.01"
                value={role.escalation}
                onChange={update(["team", idx, "escalation"])}
              />
            </div>
          ))}
        </Section>

        <Section title="Capex / Equipment">
          {assumptions.capex.map((asset, idx) => (
            <div className="capex-block" key={asset.name}>
              <div className="capex-name">{asset.name}</div>
              <div className="field-row">
                <NumberField
                  label="Month"
                  value={asset.month}
                  onChange={update(["capex", idx, "month"])}
                />
                <NumberField
                  label="Price"
                  suffix="PKR"
                  value={asset.price}
                  onChange={update(["capex", idx, "price"])}
                />
                <NumberField
                  label="Life"
                  suffix="mo"
                  value={asset.life}
                  onChange={update(["capex", idx, "life"])}
                />
              </div>
            </div>
          ))}
        </Section>

        <Section title="Financing & FX">
          <NumberField
            label="Paid-in capital"
            suffix="PKR, month 1"
            value={assumptions.financing.paidInCapital}
            onChange={update(["financing", "paidInCapital"])}
          />
          <NumberField
            label="FX rate"
            suffix="PKR/USD, reference"
            value={assumptions.fxRate}
            onChange={update(["fxRate"])}
          />
        </Section>
      </aside>

      <main className="main">
        <p className="header-eyebrow">Black Iron Quantum AI</p>
        <h1 className="header-title">ZulfiQode — 3-Year Financial Model</h1>
        <p className="header-desc">
          Interactive startup financial model — corporate and SaaS revenue ramps, cost
          structure, and cash runway, computed live from the assumptions on the left.
        </p>

        <div className="kpi-strip">
          <KpiCard label="3-Yr Revenue" value={dashboard.totalRevenue3yr} />
          <KpiCard
            label="3-Yr Net Profit"
            value={dashboard.totalNetProfit3yr}
            colorClass={signClass(dashboard.totalNetProfit3yr)}
          />
          <KpiCard
            label="Ending Cash (Mo 36)"
            value={dashboard.endingCash}
            colorClass={signClass(dashboard.endingCash)}
          />
          <KpiCard
            label="Lowest Cash Point"
            value={dashboard.lowestCash}
            colorClass={signClass(dashboard.lowestCash)}
          />
          <KpiCard
            label="Breakeven Month"
            value={dashboard.breakevenMonth ? `Mo ${dashboard.breakevenMonth}` : "Not reached"}
          />
          <KpiCard label="Corp Clients (Yr3)" value={formatNumber(dashboard.corporateClientsYr3)} />
          <KpiCard label="SaaS Subs (Yr3)" value={formatNumber(dashboard.saasSubsYr3)} />
        </div>

        <div className="panel">
          <div className="statement-tabs">
            {STATEMENT_TABS.map((t) => (
              <button
                key={t.key}
                className={`statement-tab ${statementTab === t.key ? "active" : ""}`}
                onClick={() => setStatementTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>{STATEMENT_TABS.find((t) => t.key === statementTab).label}</th>
                  {annualYears.map((i) => (
                    <th key={i}>Year {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statementTab === "summary" && (
                  <>
                    <Row label="Revenue" values={v("revenue")} />
                    <Row label="COGS" values={v("totalCogs")} />
                    <Row label="Gross Profit" values={v("grossProfit")} variant="subtotal" />
                    <Row label="Total OpEx" values={v("totalOpex")} />
                    <Row label="Net Profit" values={v("netProfit")} variant="total" colorize />
                    <Row label="Ending Cash" values={v("endingCash")} colorize />
                    <tr>
                      <td>Corporate Clients</td>
                      {annualYears.map((i) => (
                        <td key={i}>{formatNumber(annual[i].corporateClients)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td>SaaS Subscribers</td>
                      {annualYears.map((i) => (
                        <td key={i}>{formatNumber(annual[i].saasSubs)}</td>
                      ))}
                    </tr>
                  </>
                )}

                {statementTab === "income" && (
                  <>
                    <SectionRow label="Revenue" span={4} />
                    <Row label="Corporate Revenue" values={v("corporateRevenue")} />
                    <Row label="SaaS Revenue" values={v("saasRevenue")} />
                    <Row label="Total Revenue" values={v("revenue")} variant="subtotal" />

                    <SectionRow label="Cost of Revenue" span={4} />
                    <Row label="Infrastructure Cost" values={v("infraCost")} />
                    <Row label="Hosting Cost" values={v("hostingCost")} />
                    <Row label="Total COGS" values={v("totalCogs")} variant="subtotal" />
                    <Row label="Gross Profit" values={v("grossProfit")} variant="subtotal" colorize />

                    <SectionRow label="Operating Expenses" span={4} />
                    <Row label="Marketing" values={v("marketing")} />
                    <Row label="Salaries & Benefits" values={v("salary")} />
                    <Row label="General & Administrative" values={v("ga")} />
                    <Row label="Bad Debt Expense" values={v("badDebt")} />
                    <Row label="Depreciation" values={v("depreciation")} />
                    <Row label="Total Operating Expenses" values={v("totalOpex")} variant="subtotal" />

                    <SectionRow label="Profit" span={4} />
                    <Row label="Profit Before Tax" values={v("pbt")} variant="subtotal" colorize />
                    <Row label="Tax" values={v("tax")} />
                    <Row label="Net Profit" values={v("netProfit")} variant="total" colorize />
                  </>
                )}

                {statementTab === "balance" && (
                  <>
                    <SectionRow label="Assets" span={4} />
                    <Row label="Cash" values={v("cash")} colorize />
                    <Row label="Accounts Receivable" values={v("accountsReceivable")} />
                    <Row label="Equipment (Net Book Value)" values={v("equipmentNBV")} />
                    <Row
                      label="Total Assets"
                      values={cols.map((c) => c.cash + c.accountsReceivable + c.equipmentNBV)}
                      variant="total"
                    />

                    <SectionRow label="Liabilities" span={4} />
                    <Row label="Accounts Payable" values={v("accountsPayable")} />
                    <Row label="Total Liabilities" values={v("accountsPayable")} variant="subtotal" />

                    <SectionRow label="Equity" span={4} />
                    <Row label="Paid-in Capital" values={v("paidInCapital")} />
                    <Row label="Retained Earnings (Cumulative Net Profit)" values={v("cumulativeNetProfit")} colorize />
                    <Row
                      label="Total Equity"
                      values={cols.map((c) => c.paidInCapital + c.cumulativeNetProfit)}
                      variant="subtotal"
                    />

                    <Row
                      label="Total Liabilities & Equity"
                      values={cols.map((c) => c.accountsPayable + c.paidInCapital + c.cumulativeNetProfit)}
                      variant="total"
                    />
                  </>
                )}

                {statementTab === "cashflow" && (
                  <>
                    <SectionRow label="Operating Activities" span={4} />
                    <Row label="Net Profit" values={v("netProfit")} colorize />
                    <Row label="+ Depreciation" values={v("depreciation")} />
                    <Row label="(Increase) / Decrease in Accounts Receivable" values={v("arChange").map((x) => -x)} />
                    <Row label="Increase / (Decrease) in Accounts Payable" values={v("apChange")} />
                    <Row label="Net Cash from Operating Activities" values={v("operatingCash")} variant="subtotal" colorize />

                    <SectionRow label="Investing Activities" span={4} />
                    <Row label="Purchase of Equipment" values={v("investingCash")} />
                    <Row label="Net Cash from Investing Activities" values={v("investingCash")} variant="subtotal" colorize />

                    <SectionRow label="Financing Activities" span={4} />
                    <Row label="Paid-in Capital" values={v("financingCash")} />
                    <Row label="Net Cash from Financing Activities" values={v("financingCash")} variant="subtotal" colorize />

                    <SectionRow label="Net Change" span={4} />
                    <Row label="Net Change in Cash" values={v("netChange")} variant="subtotal" colorize />
                    <Row label="Beginning Cash" values={v("beginningCash")} />
                    <Row label="Ending Cash" values={v("endingCash")} variant="total" colorize />
                  </>
                )}

                {statementTab === "salary" && (
                  <>
                    {salarySchedule.map((role) => (
                      <Row key={role.name} label={role.name} values={role.yearTotals} />
                    ))}
                    <Row
                      label="Total Salaries & Benefits"
                      values={[0, 1, 2].map((i) => salarySchedule.reduce((acc, r) => acc + r.yearTotals[i], 0))}
                      variant="total"
                    />
                  </>
                )}

                {statementTab === "depreciation" && (
                  <>
                    {depreciationSchedule.map((asset) => (
                      <Row key={asset.name} label={asset.name} values={asset.yearTotals} />
                    ))}
                    <Row
                      label="Total Depreciation"
                      values={[0, 1, 2].map((i) => depreciationSchedule.reduce((acc, a) => acc + a.yearTotals[i], 0))}
                      variant="total"
                    />
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="charts-grid">
          <div className="panel">
            <h2 className="panel-title">Monthly Revenue</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={months} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#232A3A" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                />
                <YAxis
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                  tickFormatter={formatCompact}
                  width={70}
                />
                <Tooltip content={<ChartTooltip formatter={formatFull} />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#F2C230"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h2 className="panel-title">Monthly Net Profit</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={months} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#232A3A" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                />
                <YAxis
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                  tickFormatter={formatCompact}
                  width={70}
                />
                <Tooltip content={<ChartTooltip formatter={formatFull} />} />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Net Profit"
                  stroke="#3FC98A"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h2 className="panel-title">Cash Balance</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={months} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#232A3A" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                />
                <YAxis
                  tick={{ fill: "#8A93A6", fontFamily: "IBM Plex Mono", fontSize: 11 }}
                  stroke="#232A3A"
                  tickFormatter={formatCompact}
                  width={70}
                />
                <Tooltip content={<ChartTooltip formatter={formatFull} />} />
                <Line
                  type="monotone"
                  dataKey="cash"
                  name="Cash"
                  stroke="#F2C230"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
