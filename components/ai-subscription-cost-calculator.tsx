"use client";

import { useMemo, useState } from "react";
import { Calculator, CheckCircle2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Locale = "en" | "zh";

type SubscriptionRow = {
  id: string;
  name: string;
  monthlyPrice: number;
  seats: number;
  selected: boolean;
};

const starterRows: SubscriptionRow[] = [
  { id: "chatgpt-plus", name: "ChatGPT Plus", monthlyPrice: 20, seats: 1, selected: true },
  { id: "claude-pro", name: "Claude Pro", monthlyPrice: 20, seats: 1, selected: false },
  { id: "google-ai-pro", name: "Google AI Pro", monthlyPrice: 19.99, seats: 1, selected: false },
  { id: "perplexity-pro", name: "Perplexity Pro", monthlyPrice: 20, seats: 1, selected: false },
  { id: "cursor-pro", name: "Cursor Pro", monthlyPrice: 20, seats: 1, selected: false },
];

const copy = {
  en: {
    title: "Calculate your AI subscription stack",
    subtitle: "Edit the prices, select the tools you actually use, and see the monthly and yearly cost before adding another paid plan.",
    selected: "Selected",
    tool: "Tool",
    price: "Monthly price",
    seats: "Seats",
    monthly: "Monthly total",
    yearly: "Yearly total",
    perSeat: "Avg. per seat",
    add: "Add tool",
    reset: "Reset",
    remove: "Remove",
    verdictTitle: "Verdict",
    low: "This is a controlled stack. Keep it if each tool has a weekly job.",
    medium: "This is getting expensive. Remove overlapping tools before adding another plan.",
    high: "This is a heavy subscription stack. You should justify it with client work, team usage, or revenue.",
    note: "Prices are editable starting points. Check official pricing before subscribing.",
  },
  zh: {
    title: "计算你的 AI 订阅组合",
    subtitle: "改价格，勾选真正会用的工具，在继续买下一个付费计划前先看月成本和年成本。",
    selected: "选中",
    tool: "工具",
    price: "月费",
    seats: "人数",
    monthly: "每月合计",
    yearly: "每年合计",
    perSeat: "人均月费",
    add: "添加工具",
    reset: "重置",
    remove: "删除",
    verdictTitle: "结论",
    low: "这个订阅组合还可控。前提是每个工具都有每周真实任务。",
    medium: "这个组合已经开始贵了。继续加订阅前，先删掉功能重叠的工具。",
    high: "这是重度订阅组合。除非能对应客户交付、团队使用或收入，否则不建议普通用户长期持有。",
    note: "价格只是可编辑的起始值。订阅前请以官方价格页为准。",
  },
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function toNumber(value: string, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 ? next : fallback;
}

export default function AiSubscriptionCostCalculator({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [rows, setRows] = useState<SubscriptionRow[]>(starterRows);

  const selectedRows = rows.filter((row) => row.selected);
  const monthlyTotal = useMemo(
    () => selectedRows.reduce((sum, row) => sum + row.monthlyPrice * row.seats, 0),
    [selectedRows],
  );
  const totalSeats = selectedRows.reduce((sum, row) => sum + row.seats, 0);
  const yearlyTotal = monthlyTotal * 12;
  const averagePerSeat = totalSeats > 0 ? monthlyTotal / totalSeats : 0;

  const verdict = monthlyTotal >= 100 ? t.high : monthlyTotal >= 40 ? t.medium : t.low;

  function updateRow(id: string, patch: Partial<SubscriptionRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const id = `custom-${Date.now()}`;
    setRows((current) => [
      ...current,
      { id, name: locale === "zh" ? "自定义 AI 工具" : "Custom AI tool", monthlyPrice: 10, seats: 1, selected: true },
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <section className="rounded-lg border bg-white shadow-sm">
      <div className="grid min-w-0 gap-6 p-5 lg:grid-cols-[1.2fr_0.8fr] md:p-6">
        <div className="min-w-0">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700">
                <Calculator className="h-4 w-4" />
                {t.title}
              </div>
              <p className="max-w-2xl text-sm leading-6 text-slate-600">{t.subtitle}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setRows(starterRows)}>
              <RotateCcw className="h-4 w-4" />
              {t.reset}
            </Button>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[72px_1fr_150px_110px_52px] gap-3 border-b pb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                <div>{t.selected}</div>
                <div>{t.tool}</div>
                <div>{t.price}</div>
                <div>{t.seats}</div>
                <div />
              </div>
              <div className="divide-y">
                {rows.map((row) => (
                  <div key={row.id} className="grid grid-cols-[72px_1fr_150px_110px_52px] gap-3 py-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(event) => updateRow(row.id, { selected: event.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                        aria-label={`${t.selected}: ${row.name}`}
                      />
                    </label>
                    <Input value={row.name} onChange={(event) => updateRow(row.id, { name: event.target.value })} />
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.monthlyPrice}
                      onChange={(event) => updateRow(row.id, { monthlyPrice: toNumber(event.target.value, row.monthlyPrice) })}
                    />
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.seats}
                      onChange={(event) => updateRow(row.id, { seats: Math.max(1, Math.round(toNumber(event.target.value, row.seats))) })}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(row.id)} aria-label={`${t.remove}: ${row.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={addRow} className="bg-emerald-700 hover:bg-emerald-800">
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
            <p className="text-xs leading-5 text-slate-500">{t.note}</p>
          </div>
        </div>

        <aside className="rounded-lg border bg-slate-50 p-5">
          <div className="grid gap-3">
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm font-medium text-slate-500">{t.monthly}</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">{money(monthlyTotal)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white p-4">
                <p className="text-sm font-medium text-slate-500">{t.yearly}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{money(yearlyTotal)}</p>
              </div>
              <div className="rounded-lg bg-white p-4">
                <p className="text-sm font-medium text-slate-500">{t.perSeat}</p>
                <p className="mt-1 text-xl font-bold text-slate-950">{money(averagePerSeat)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              {t.verdictTitle}
            </div>
            <p className="mt-2 text-sm leading-6 text-emerald-950">{verdict}</p>
          </div>

          <div className="mt-5 space-y-2 text-sm text-slate-600">
            {selectedRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{row.name}</span>
                <span className="font-semibold text-slate-950">{money(row.monthlyPrice * row.seats)}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
