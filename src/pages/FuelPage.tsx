import { useState, useMemo, useCallback } from "react";
import {
  Fuel, Search, ChevronLeft, ChevronRight, Upload, FileSpreadsheet,
  DollarSign, Gauge, TrendingDown, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, BarChart3, ArrowUpDown, Plus, Pencil, Trash2
} from "lucide-react";
import CrudDialog, { DeleteDialog } from "@/components/CrudDialog";
import { toast } from "sonner";
import KPICard from "@/components/KPICard";
import {
  fuelLogs, vehicleConsumptions, monthlyFuelTrend, deviationBuckets,
  fuelStats, csvPreviewSample, FuelLog, VehicleConsumption, CSVPreviewRow
} from "@/data/fuelData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, ComposedChart, ReferenceLine
} from "recharts";

type Tab = "logs" | "import" | "ranking" | "analysis";

const PAGE_SIZE = 20;

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtNumber = (v: number) => v.toLocaleString("pt-BR");

export default function FuelPage() {
  const [tab, setTab] = useState<Tab>("logs");

  const tabs: { id: Tab; label: string }[] = [
    { id: "logs", label: "Abastecimentos" },
    { id: "ranking", label: "Ranking Consumo" },
    { id: "analysis", label: "Análise de Desvio" },
    { id: "import", label: "Importar CSV" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Combustível</h1>
        <p className="text-sm text-muted-foreground">Controle de abastecimentos, consumo e importação de dados</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Litros no Mês" value={`${fmtNumber(Math.round(fuelStats.totalLitersMonth))} L`} subtitle="Fevereiro 2026" icon={Fuel} variant="info" />
        <KPICard title="Gasto no Mês" value={fmtCurrency(fuelStats.totalValueMonth)} subtitle={`Preço médio: R$ ${fuelStats.avgPrice}`} icon={DollarSign} variant="default" />
        <KPICard title="Média da Frota" value={`${fuelStats.fleetAvg} km/l`} subtitle="Consumo médio geral" icon={Gauge} variant="success" />
        <KPICard title="Abaixo da Média" value={fuelStats.belowAvgCount} subtitle="Veículos com desvio > 15%" icon={AlertTriangle} variant="critical" />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.id ? "border-info text-info" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "logs" && <LogsTab />}
      {tab === "ranking" && <RankingTab />}
      {tab === "analysis" && <AnalysisTab />}
      {tab === "import" && <ImportTab />}
    </div>
  );
}

/* ====== LOGS TAB ====== */
function LogsTab() {
  const [data, setData] = useState<FuelLog[]>(() => [...fuelLogs]);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof FuelLog>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; item?: FuelLog } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FuelLog | null>(null);

  const units = [...new Set(fuelLogs.map(l => l.unit))];
  const fuelTypes = [...new Set(fuelLogs.map(l => l.fuelType))];

  const filtered = useMemo(() => {
    let result = data.filter(l => {
      const matchSearch = !search ||
        l.plate.toLowerCase().includes(search.toLowerCase()) ||
        l.driver.toLowerCase().includes(search.toLowerCase()) ||
        l.station.toLowerCase().includes(search.toLowerCase());
      const matchUnit = unitFilter === "all" || l.unit === unitFilter;
      const matchFuel = fuelTypeFilter === "all" || l.fuelType === fuelTypeFilter;
      return matchSearch && matchUnit && matchFuel;
    });
    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "number" && typeof bVal === "number") return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      return sortDir === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
    });
    return result;
  }, [data, search, unitFilter, fuelTypeFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (field: keyof FuelLog) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortHeader = ({ field, label, className = "" }: { field: keyof FuelLog; label: string; className?: string }) => (
    <th className={`px-3 py-2.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors ${className}`}
      onClick={() => { toggleSort(field); setPage(1); }}>
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && <ArrowUpDown className="h-3 w-3" />}
      </div>
    </th>
  );

  const fuelFields = [
    { name: "date", label: "Data", type: "date" as const, required: true },
    { name: "plate", label: "Placa", required: true, placeholder: "ABC1D23" },
    { name: "driver", label: "Motorista", required: true, placeholder: "Nome" },
    { name: "liters", label: "Litros", type: "number" as const, required: true },
    { name: "value", label: "Valor (R$)", type: "number" as const, required: true },
    { name: "km", label: "KM", type: "number" as const, required: true },
    { name: "consumption", label: "Consumo (km/l)", type: "number" as const },
    { name: "station", label: "Posto", placeholder: "Nome do posto" },
    { name: "fuelType", label: "Combustível", type: "select" as const, options: [
      { value: "Gasolina", label: "Gasolina" }, { value: "Etanol", label: "Etanol" }, { value: "Diesel", label: "Diesel" }, { value: "Diesel S-10", label: "Diesel S-10" },
    ]},
  ];

  const handleSave = (values: Record<string, any>) => {
    if (dialog?.mode === "edit" && dialog.item) {
      setData(prev => prev.map(l => l.id === dialog.item!.id ? { ...l, ...values } as FuelLog : l));
      toast.success("Abastecimento atualizado");
    } else {
      const newLog: FuelLog = {
        id: String(Date.now()),
        date: values.date, plate: values.plate, driver: values.driver,
        liters: Number(values.liters), value: Number(values.value),
        km: Number(values.km), consumption: Number(values.consumption) || 0,
        station: values.station || "", fuelType: values.fuelType || "Gasolina",
        unit: "Matriz SP", vehicleLabel: values.plate,
        vehicle_id: "", pricePerLiter: Number(values.value) / (Number(values.liters) || 1),
        previousKm: 0, kmDriven: 0,
      };
      setData(prev => [newLog, ...prev]);
      toast.success("Abastecimento cadastrado");
    }
    setDialog(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setData(prev => prev.filter(l => l.id !== deleteTarget.id));
      toast.success("Abastecimento excluído");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar placa, motorista ou posto..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={unitFilter} onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todas unidades</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={fuelTypeFilter} onChange={(e) => { setFuelTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todos combustíveis</option>
          {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo
        </button>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} registros</p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <SortHeader field="date" label="Data" className="text-left" />
                <SortHeader field="plate" label="Placa" className="text-left" />
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Motorista</th>
                <SortHeader field="liters" label="Litros" className="text-right" />
                <SortHeader field="value" label="Valor" className="text-right hidden sm:table-cell" />
                <SortHeader field="consumption" label="km/l" className="text-right" />
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Posto</th>
                <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 text-xs text-foreground">{new Date(log.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs font-semibold text-foreground">{log.plate}</span>
                    <p className="text-[10px] text-muted-foreground">{log.vehicleLabel}</p>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{log.driver}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-medium text-foreground">{log.liters.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-foreground hidden sm:table-cell">{fmtCurrency(log.value)}</td>
                  <td className="px-3 py-2.5 text-xs text-right">
                    <span className={`font-medium ${log.consumption < fuelStats.fleetAvg * 0.85 ? "text-critical" : log.consumption < fuelStats.fleetAvg ? "text-warning" : "text-success"}`}>
                      {log.consumption}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[150px]">{log.station}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDialog({ mode: "edit", item: log })}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteTarget(log)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-critical hover:bg-critical/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} setPage={setPage} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} />
      </div>

      {dialog && (
        <CrudDialog title={dialog.mode === "create" ? "Novo Abastecimento" : "Editar Abastecimento"}
          fields={fuelFields} initialValues={dialog.item || {}} onSave={handleSave} onClose={() => setDialog(null)} />
      )}
      {deleteTarget && (
        <DeleteDialog title="Excluir Abastecimento"
          message={`Excluir abastecimento de ${deleteTarget.plate} em ${new Date(deleteTarget.date).toLocaleDateString("pt-BR")}?`}
          onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

/* ====== RANKING TAB ====== */
function RankingTab() {
  const [sortBy, setSortBy] = useState<"worst" | "best">("worst");
  const sorted = sortBy === "worst" ? vehicleConsumptions.slice(0, 30) : [...vehicleConsumptions].reverse().slice(0, 30);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Ranking de consumo — Top 30 veículos</p>
        <div className="flex gap-2">
          <button onClick={() => setSortBy("worst")}
            className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${sortBy === "worst" ? "border-critical bg-critical/10 text-critical" : "border-border bg-card text-muted-foreground"}`}>
            <TrendingDown className="h-3.5 w-3.5 inline mr-1" />Piores
          </button>
          <button onClick={() => setSortBy("best")}
            className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${sortBy === "best" ? "border-success bg-success/10 text-success" : "border-border bg-card text-muted-foreground"}`}>
            <TrendingUp className="h-3.5 w-3.5 inline mr-1" />Melhores
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-border bg-card p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} unit=" km/l" />
            <YAxis dataKey="plate" type="category" width={80} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip formatter={(v: number) => `${v} km/l`} />
            <ReferenceLine x={fuelStats.fleetAvg} stroke="hsl(var(--chart-1))" strokeDasharray="5 5" label={{ value: `Média: ${fuelStats.fleetAvg}`, position: "top", fontSize: 11, fill: "hsl(var(--chart-1))" }} />
            <Bar dataKey="avgConsumption" name="Consumo (km/l)" radius={[0, 4, 4, 0]}>
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.avgConsumption < fuelStats.fleetAvg * 0.85 ? "hsl(var(--chart-4))" : entry.avgConsumption < fuelStats.fleetAvg ? "hsl(var(--chart-3))" : "hsl(var(--chart-2))"} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">#</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Placa</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Veículo</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Unidade</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">km/l</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Desvio</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Total L</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Total R$</th>
                <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">Abast.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((v, i) => (
                <tr key={v.plate} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-xs text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs font-semibold text-foreground">{v.plate}</td>
                  <td className="px-3 py-2 text-xs text-foreground hidden sm:table-cell">{v.vehicleLabel}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground hidden md:table-cell">{v.unit}</td>
                  <td className="px-3 py-2 text-xs text-right">
                    <span className={`font-bold ${v.avgConsumption < fuelStats.fleetAvg * 0.85 ? "text-critical" : v.avgConsumption < fuelStats.fleetAvg ? "text-warning" : "text-success"}`}>
                      {v.avgConsumption}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-right">
                    <span className={`font-medium ${v.deviation < -15 ? "text-critical" : v.deviation < -5 ? "text-warning" : "text-success"}`}>
                      {v.deviation > 0 ? "+" : ""}{v.deviation}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-right text-muted-foreground hidden sm:table-cell">{fmtNumber(v.totalLiters)}</td>
                  <td className="px-3 py-2 text-xs text-right text-foreground hidden md:table-cell">{fmtCurrency(v.totalValue)}</td>
                  <td className="px-3 py-2 text-xs text-right text-muted-foreground hidden lg:table-cell">{v.refuelCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ====== ANALYSIS TAB ====== */
function AnalysisTab() {
  return (
    <div className="space-y-4 animate-slide-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Deviation histogram */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Distribuição de Desvio de Consumo</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Quantidade de veículos por faixa de desvio da média ({fuelStats.fleetAvg} km/l)</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={deviationBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip />
              <Bar dataKey="count" name="Veículos" radius={[4, 4, 0, 0]}>
                {deviationBuckets.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly trend */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Evolução Mensal</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Litros consumidos e gasto total — 6 meses</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={monthlyFuelTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number, name: string) => name === "Litros" ? `${fmtNumber(v)} L` : fmtCurrency(v)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="liters" name="Litros" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} opacity={0.7} />
              <Line yAxisId="right" type="monotone" dataKey="value" name="Valor (R$)" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consumption trend */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">Consumo Médio da Frota (km/l)</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Evolução mensal do consumo médio</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyFuelTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis domain={[8, 10]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip formatter={(v: number) => `${v} km/l`} />
            <Line type="monotone" dataKey="avgConsumption" name="Consumo Médio" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 5, fill: "hsl(var(--chart-2))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-3">⚠️ Veículos com Consumo Anômalo (desvio {`>`} 15%)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {vehicleConsumptions.filter(v => v.deviation < -15).slice(0, 9).map(v => (
            <div key={v.plate} className="rounded-lg border border-l-4 border-l-critical border-t-border border-r-border border-b-border bg-card p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-bold text-foreground">{v.plate}</span>
                <span className="text-xs font-bold text-critical">{v.deviation}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{v.vehicleLabel} — {v.unit}</p>
              <div className="flex items-center justify-between mt-2 text-[10px]">
                <span className="text-muted-foreground">Consumo: <strong className="text-critical">{v.avgConsumption} km/l</strong></span>
                <span className="text-muted-foreground">Média: {v.fleetAvg} km/l</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ====== IMPORT TAB ====== */
function ImportTab() {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [dragOver, setDragOver] = useState(false);

  const validCount = csvPreviewSample.filter(r => r.valid).length;
  const errorCount = csvPreviewSample.filter(r => !r.valid).length;

  return (
    <div className="space-y-4 animate-slide-in">
      {step === "upload" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); setStep("preview"); }}
          className={`rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer
            ${dragOver ? "border-info bg-info/5" : "border-border bg-card hover:border-muted-foreground"}`}
          onClick={() => setStep("preview")}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Arraste o arquivo CSV/Excel aqui</p>
              <p className="text-xs text-muted-foreground mt-1">ou clique para selecionar. Formatos: .csv, .xlsx, .xls</p>
            </div>
            <div className="rounded-lg bg-muted p-3 max-w-md">
              <p className="text-[11px] text-muted-foreground font-medium mb-1">Colunas esperadas:</p>
              <p className="text-[10px] text-muted-foreground font-mono">placa, data, litros, valor, km, posto</p>
            </div>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-5 w-5 text-info" />
              <div>
                <p className="text-sm font-semibold text-foreground">abastecimentos_fev2026.csv</p>
                <p className="text-xs text-muted-foreground">{csvPreviewSample.length} registros encontrados</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep("upload")} className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
              <button onClick={() => setStep("done")} className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                Importar {validCount} válidos
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="text-lg font-bold text-foreground">{csvPreviewSample.length}</p>
              <p className="text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="rounded-lg border border-border bg-success/5 p-3 text-center">
              <p className="text-lg font-bold text-success">{validCount}</p>
              <p className="text-[11px] text-muted-foreground">Válidos</p>
            </div>
            <div className="rounded-lg border border-border bg-critical/5 p-3 text-center">
              <p className="text-lg font-bold text-critical">{errorCount}</p>
              <p className="text-[11px] text-muted-foreground">Com erro</p>
            </div>
          </div>

          {/* Preview table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase w-10">✓</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Placa</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Data</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Litros</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Valor</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">KM</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Posto</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {csvPreviewSample.map((row, i) => (
                    <tr key={i} className={`transition-colors ${row.valid ? "hover:bg-muted/30" : "bg-critical/5"}`}>
                      <td className="px-3 py-2.5 text-center">
                        {row.valid
                          ? <CheckCircle2 className="h-4 w-4 text-success mx-auto" />
                          : <XCircle className="h-4 w-4 text-critical mx-auto" />}
                      </td>
                      <td className={`px-3 py-2.5 font-mono text-xs font-medium ${row.valid ? "text-foreground" : "text-critical"}`}>{row.plate}</td>
                      <td className="px-3 py-2.5 text-xs text-foreground">{row.date}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-foreground">{row.liters}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-foreground">R$ {row.value}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-muted-foreground hidden sm:table-cell">{row.km}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{row.station}</td>
                      <td className="px-3 py-2.5">
                        {row.valid
                          ? <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">OK</span>
                          : <span className="inline-flex rounded-full bg-critical/10 px-2 py-0.5 text-[10px] font-medium text-critical">{row.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">Importação concluída!</p>
              <p className="text-sm text-muted-foreground mt-1">{validCount} registros importados com sucesso. {errorCount} registros ignorados.</p>
            </div>
            <button onClick={() => setStep("upload")} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Importar outro arquivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ====== PAGINATION ====== */
function Pagination({ page, setPage, totalPages, totalItems, pageSize }: { page: number; setPage: (p: number) => void; totalPages: number; totalItems: number; pageSize: number }) {
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30">
      <span className="text-xs text-muted-foreground">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems}
      </span>
      <div className="flex gap-1">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const n = page <= 3 ? i + 1 : page + i - 2;
          if (n < 1 || n > totalPages) return null;
          return (
            <button key={n} onClick={() => setPage(n)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${n === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {n}
            </button>
          );
        })}
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
