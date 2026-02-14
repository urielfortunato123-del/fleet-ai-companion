import { useState, useMemo } from "react";
import {
  CircleDot, Search, AlertTriangle, CheckCircle2, AlertCircle,
  DollarSign, Calendar, BarChart3, RotateCcw, TrendingUp
} from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import {
  tires, rotationHistory, replacementForecasts, getTireStats,
  positionLabels, Tire, TireStatus, TirePosition
} from "@/data/tireData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from "recharts";

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tabs = [
  { id: "inventory", label: "Inventário", icon: CircleDot },
  { id: "rotations", label: "Rodízios", icon: RotateCcw },
  { id: "costs", label: "Custo/km", icon: DollarSign },
  { id: "forecast", label: "Previsão Troca", icon: Calendar },
] as const;
type TabId = typeof tabs[number]["id"];

const statusConfig: Record<TireStatus, { label: string; chip: string }> = {
  good: { label: "Bom", chip: "resolved" },
  attention: { label: "Atenção", chip: "medium" },
  critical: { label: "Crítico", chip: "critical" },
  replaced: { label: "Trocado", chip: "low" },
};

export default function TiresPage() {
  const [tab, setTab] = useState<TabId>("inventory");
  const stats = useMemo(() => getTireStats(), []);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Pneus</h1>
        <p className="text-sm text-muted-foreground">Controle de vida útil, rodízio, custo/km e previsão de troca</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Total Pneus" value={stats.total} icon={CircleDot} />
        <KPICard title="Bom Estado" value={stats.good} icon={CheckCircle2} trend={{ value: Math.round(stats.good / stats.total * 100), label: "% do total" }} />
        <KPICard title="Atenção/Crítico" value={stats.attention + stats.critical} icon={AlertTriangle} trend={{ value: stats.critical, label: "críticos" }} />
        <KPICard title="Troca em 30 dias" value={stats.next30} icon={Calendar} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors
                ${tab === t.id ? "border-info text-info" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === "inventory" && <InventoryTab />}
      {tab === "rotations" && <RotationsTab />}
      {tab === "costs" && <CostsTab />}
      {tab === "forecast" && <ForecastTab />}
    </div>
  );
}

/* ===== INVENTORY TAB ===== */
function InventoryTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TireStatus | "all">("all");
  const [unitFilter, setUnitFilter] = useState("all");

  const units = useMemo(() => [...new Set(tires.map(t => t.unit))].sort(), []);

  const filtered = useMemo(() =>
    tires.filter(t => {
      if (search && !t.plate.toLowerCase().includes(search.toLowerCase()) && !t.brand.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (unitFilter !== "all" && t.unit !== unitFilter) return false;
      return true;
    }),
  [search, statusFilter, unitFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar placa ou marca..."
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TireStatus | "all")}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos status</option>
          <option value="good">Bom</option>
          <option value="attention">Atenção</option>
          <option value="critical">Crítico</option>
        </select>
        <select value={unitFilter} onChange={e => setUnitFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todas unidades</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Placa","Posição","Marca/Modelo","Medida","Profundidade","Vida Útil","Status","Custo"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 80).map(t => {
                const usedKm = t.currentKm - t.installedKm;
                const lifePct = Math.min(100, Math.round((usedKm / t.lifeExpectedKm) * 100));
                return (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                    <td className="px-3 py-2 font-mono font-medium text-foreground">{t.plate}</td>
                    <td className="px-3 py-2 text-foreground">{positionLabels[t.position]}</td>
                    <td className="px-3 py-2 text-foreground">{t.brand} {t.model}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.size}</td>
                    <td className="px-3 py-2">
                      <span className={`font-bold ${t.depthMm >= 4 ? "text-success" : t.depthMm >= 2 ? "text-warning" : "text-critical"}`}>
                        {t.depthMm} mm
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${lifePct < 70 ? "bg-success" : lifePct < 90 ? "bg-warning" : "bg-critical"}`}
                            style={{ width: `${lifePct}%` }} />
                        </div>
                        <span className="text-muted-foreground">{lifePct}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2"><StatusChip status={statusConfig[t.status].chip as any} /></td>
                    <td className="px-3 py-2 text-foreground">{fmtCurrency(t.costUnit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border">
          {filtered.length} pneus encontrados
        </div>
      </div>
    </div>
  );
}

/* ===== ROTATIONS TAB ===== */
function RotationsTab() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    rotationHistory.filter(r =>
      !search || r.plate.toLowerCase().includes(search.toLowerCase()) || r.notes.toLowerCase().includes(search.toLowerCase())
    ),
  [search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar placa..."
          className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Data","Placa","Unidade","KM","Tipo","Custo"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-foreground">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2 font-mono font-medium text-foreground">{r.plate}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.unit}</td>
                  <td className="px-3 py-2 text-foreground">{r.km.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2 text-foreground">{r.notes}</td>
                  <td className="px-3 py-2 text-foreground">{fmtCurrency(r.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border">
          {filtered.length} rodízios registrados
        </div>
      </div>
    </div>
  );
}

/* ===== COSTS TAB ===== */
function CostsTab() {
  const costByBrand = useMemo(() => {
    const map = new Map<string, { brand: string; totalCost: number; totalKm: number; count: number }>();
    for (const t of tires) {
      const existing = map.get(t.brand) || { brand: t.brand, totalCost: 0, totalKm: 0, count: 0 };
      existing.totalCost += t.costUnit;
      existing.totalKm += t.currentKm - t.installedKm;
      existing.count++;
      map.set(t.brand, existing);
    }
    return [...map.values()]
      .map(b => ({ ...b, costPerKm: b.totalKm > 0 ? b.totalCost / b.totalKm : 0 }))
      .sort((a, b) => a.costPerKm - b.costPerKm);
  }, []);

  const costByUnit = useMemo(() => {
    const map = new Map<string, { unit: string; totalCost: number; totalKm: number; count: number }>();
    for (const t of tires) {
      const existing = map.get(t.unit) || { unit: t.unit, totalCost: 0, totalKm: 0, count: 0 };
      existing.totalCost += t.costUnit;
      existing.totalKm += t.currentKm - t.installedKm;
      existing.count++;
      map.set(t.unit, existing);
    }
    return [...map.values()]
      .map(u => ({ ...u, costPerKm: u.totalKm > 0 ? u.totalCost / u.totalKm : 0 }))
      .sort((a, b) => a.costPerKm - b.costPerKm);
  }, []);

  const statusDist = useMemo(() => [
    { name: "Bom", value: tires.filter(t => t.status === "good").length, fill: "hsl(var(--success))" },
    { name: "Atenção", value: tires.filter(t => t.status === "attention").length, fill: "hsl(var(--warning))" },
    { name: "Crítico", value: tires.filter(t => t.status === "critical").length, fill: "hsl(var(--critical))" },
  ], []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost per km by brand */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-info" />
            <h3 className="text-sm font-bold text-card-foreground">Custo/km por Marca</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={costByBrand} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => `R$ ${v.toFixed(3)}`} />
              <YAxis type="category" dataKey="brand" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} width={75} />
              <Tooltip formatter={(v: number) => [`R$ ${v.toFixed(4)}/km`, "Custo/km"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="costPerKm" radius={[0, 4, 4, 0]}>
                {costByBrand.map((_, i) => (
                  <Cell key={i} fill={i < 2 ? "hsl(var(--success))" : i < 4 ? "hsl(var(--warning))" : "hsl(var(--critical))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <CircleDot className="h-4 w-4 text-info" />
            <h3 className="text-sm font-bold text-card-foreground">Distribuição por Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}
                label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                {statusDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost per km by unit */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-bold text-card-foreground">Custo/km por Unidade</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Unidade","Pneus","Custo Total","KM Total","Custo/km"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {costByUnit.map(u => (
                <tr key={u.unit} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{u.unit}</td>
                  <td className="px-3 py-2 text-foreground">{u.count}</td>
                  <td className="px-3 py-2 text-foreground">{fmtCurrency(u.totalCost)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{u.totalKm.toLocaleString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold ${u.costPerKm < 0.01 ? "text-success" : u.costPerKm < 0.02 ? "text-warning" : "text-critical"}`}>
                      R$ {u.costPerKm.toFixed(4)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ===== FORECAST TAB ===== */
function ForecastTab() {
  const [period, setPeriod] = useState<"30" | "60" | "90">("30");

  const filtered = useMemo(() => {
    const now = new Date();
    const limit = new Date();
    limit.setDate(limit.getDate() + Number(period));
    return replacementForecasts.filter(f => {
      const d = new Date(f.estimatedReplaceDate);
      return d >= now && d <= limit;
    });
  }, [period]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; count: number; cost: number }>();
    for (const f of replacementForecasts.slice(0, 200)) {
      const d = new Date(f.estimatedReplaceDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      const existing = map.get(key) || { month: label, count: 0, cost: 0 };
      existing.count++;
      existing.cost += f.costEstimate;
      map.set(key, existing);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, v]) => v).slice(0, 8);
  }, []);

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-1.5">
        {(["30", "60", "90"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors
              ${period === p ? "border-info bg-info/10 text-info" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
            Próximos {p} dias
          </button>
        ))}
      </div>

      {/* Forecast chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-info" />
          <h3 className="text-sm font-bold text-card-foreground">Previsão de Trocas por Mês</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMonth}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
              formatter={(v: number, name: string) => [name === "count" ? `${v} pneus` : fmtCurrency(v), name === "count" ? "Quantidade" : "Custo"]} />
            <Bar dataKey="count" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} name="Quantidade" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Placa","Unidade","Posição","Vida Usada","Data Estimada","Custo Estimado"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(f => {
                const urgent = f.currentLifePct >= 90;
                return (
                  <tr key={f.id} className={`border-b border-border hover:bg-muted/20 transition-colors ${urgent ? "bg-critical/5" : ""}`}>
                    <td className="px-3 py-2 font-mono font-medium text-foreground">{f.plate}</td>
                    <td className="px-3 py-2 text-muted-foreground">{f.unit}</td>
                    <td className="px-3 py-2 text-foreground">{positionLabels[f.position]}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${f.currentLifePct < 70 ? "bg-success" : f.currentLifePct < 90 ? "bg-warning" : "bg-critical"}`}
                            style={{ width: `${f.currentLifePct}%` }} />
                        </div>
                        <span className={`font-bold ${f.currentLifePct >= 90 ? "text-critical" : f.currentLifePct >= 70 ? "text-warning" : "text-foreground"}`}>
                          {f.currentLifePct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-foreground">{new Date(f.estimatedReplaceDate).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-2 text-foreground">{fmtCurrency(f.costEstimate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-[10px] text-muted-foreground border-t border-border">
          {filtered.length} trocas previstas nos próximos {period} dias
        </div>
      </div>
    </div>
  );
}
