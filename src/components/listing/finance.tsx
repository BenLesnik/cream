"use client";

import { useState } from "react";
import { formatMoney, monthlyRepayment, stampDutyEstimate } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { useSettings } from "@/store/settings";
import { Segmented } from "../ui/primitives";

function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-muted">{label}</span>
      <span className="flex h-9 items-center rounded-lg border border-line bg-surface px-2.5 focus-within:border-fg/50">
        {prefix ? <span className="mr-1 text-[13px] text-muted">{prefix}</span> : null}
        <input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-full min-w-0 flex-1 bg-transparent text-[13.5px] tabular outline-none"
        />
        {suffix ? <span className="ml-1 text-[13px] text-muted">{suffix}</span> : null}
      </span>
    </label>
  );
}

export function MortgageCalculator({ listing }: { listing: Listing }) {
  const s = useSettings();
  const [price, setPrice] = useState(Math.round(listing.price ?? 1_000_000));
  const [deposit, setDeposit] = useState(s.depositPct);
  const [rate, setRate] = useState(s.interestRate);
  const [term, setTerm] = useState(s.loanTerm);
  const [freq, setFreq] = useState<"month" | "fortnight" | "week">("month");

  const loan = Math.max(0, price * (1 - deposit / 100));
  const monthly = monthlyRepayment(loan, rate, term);
  const repayment = freq === "month" ? monthly : freq === "fortnight" ? (monthly * 12) / 26 : (monthly * 12) / 52;
  const duty = stampDutyEstimate(price, listing.address.state);
  const totalInterest = monthly * term * 12 - loan;
  const upfront = price * (deposit / 100) + duty;
  const principalShare = loan / Math.max(1, loan + totalInterest);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <NumberInput label="Purchase price" value={price} onChange={setPrice} prefix="$" step={10_000} />
        <NumberInput label="Deposit" value={deposit} onChange={setDeposit} suffix="%" step={1} />
        <NumberInput label="Interest rate" value={rate} onChange={setRate} suffix="%" step={0.05} />
        <NumberInput label="Loan term" value={term} onChange={setTerm} suffix="yrs" step={1} />
      </div>
      <div className="mt-4 grid gap-4 rounded-xl bg-surface-2 p-4 sm:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted">Estimated repayment</span>
            <Segmented
              size="sm"
              value={freq}
              onChange={setFreq}
              options={[
                { value: "week", label: "Wk" },
                { value: "fortnight", label: "Fn" },
                { value: "month", label: "Mo" },
              ]}
            />
          </div>
          <div className="mt-1 text-[28px] font-semibold tracking-[-0.02em] tabular">
            {formatMoney(repayment, "full")}
            <span className="ml-1 text-[14px] font-normal text-muted">/ {freq}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-accent" style={{ width: `${principalShare * 100}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11.5px] text-muted tabular">
            <span>Principal {formatMoney(loan)}</span>
            <span>Interest {formatMoney(Math.max(0, totalInterest))}</span>
          </div>
        </div>
        <dl className="space-y-1.5 text-[13px] sm:border-l sm:border-line sm:pl-4">
          <Row label="Loan amount" value={formatMoney(loan, "full")} />
          <Row label={`Deposit (${deposit}%)`} value={formatMoney(price * (deposit / 100), "full")} />
          <Row label={`Stamp duty (${listing.address.state || "est."})`} value={formatMoney(duty, "full")} />
          <Row label="Upfront cash" value={formatMoney(upfront, "full")} strong />
        </dl>
      </div>
      <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
        Estimates only, using principal-and-interest repayments and general transfer duty rates. They exclude concessions, LMI and fees.
      </p>
    </div>
  );
}

export function RentCalculator({ listing }: { listing: Listing }) {
  const weekly = listing.price ?? 0;
  if (!weekly) return <p className="text-[13px] text-muted">Rent hasn&rsquo;t been published for this property.</p>;
  const income = (weekly * 52) / 0.3;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {[
        { label: "Per month", value: formatMoney((weekly * 52) / 12, "full") },
        { label: "Bond (4 weeks)", value: formatMoney(weekly * 4, "full") },
        { label: "Income for 30% rule", value: `${formatMoney(income)} p.a.` },
      ].map((t) => (
        <div key={t.label} className="rounded-xl bg-surface-2 p-3.5">
          <div className="text-[12px] text-muted">{t.label}</div>
          <div className="mt-0.5 text-[18px] font-semibold tracking-tight tabular">{t.value}</div>
        </div>
      ))}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={strong ? "font-semibold tabular" : "tabular"}>{value}</dd>
    </div>
  );
}
