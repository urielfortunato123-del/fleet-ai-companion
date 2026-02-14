import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, Car, Wrench, Fuel, TrendingDown, TrendingUp, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

interface TelemetryRow {
  plate: string;
  vehicle_label: string;
  km_start: number;
  km_end: number;
  days_in_maintenance: number;
  unit: string;
}

interface AnalysisResult {
  plate: string;
  vehicle_label: string;
  unit: string;
  franchise_km: number;
  telemetry_km: number;
  fuel_km: number | null;
  maintenance_days: number;
  effective_days: number;
  km_per_effective_day: number;
  projected_monthly_km: number;
  status: "underutilized" | "within" | "over";
  deviation_pct: number;
  has_maintenance_justification: boolean;
  open_work_orders: number;
}

const statusConfig = {
  underutilized: { label: "Subutilizado", className: "bg-warning/10 text-warning", icon: TrendingDown },
  within: { label: "Dentro da franquia", className: "bg-success/10 text-success", icon: CheckCircle2 },
  over: { label: "Acima da franquia", className: "bg-critical/10 text-critical", icon: TrendingUp },
};

export default function FleetUtilization() {
  const [importing, setImporting] = useState(false);
  const [monthRef, setMonthRef] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [summary, setSummary] = useState<{ under: number; within: number; over: number; total: number } | null>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        toast({ title: "Arquivo vazio", description: "Nenhum dado encontrado na planilha.", variant: "destructive" });
        setImporting(false);
        return;
      }

      // Map columns - flexible matching
      const telemetryRows: TelemetryRow[] = rows.map((row) => {
        const plate = String(row["Placa"] || row["placa"] || row["PLACA"] || row["plate"] || "").trim().toUpperCase();
        const vehicle_label = String(row["Veículo"] || row["veiculo"] || row["vehicle"] || row["Descrição"] || "").trim();
        const km_start = Number(row["Km Início"] || row["km_inicio"] || row["km_start"] || row["Km Inicial"] || 0);
        const km_end = Number(row["Km Fim"] || row["km_fim"] || row["km_end"] || row["Km Final"] || 0);
        const days_in_maintenance = Number(row["Dias Manutenção"] || row["dias_manutencao"] || row["days_maintenance"] || 0);
        const unit = String(row["Unidade"] || row["unidade"] || row["unit"] || "").trim();
        return { plate, vehicle_label, km_start, km_end, days_in_maintenance, unit };
      }).filter(r => r.plate);

      // Parse month reference
      const [year, month] = monthRef.split("-").map(Number);
      const monthDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();

      // Upsert telemetry readings
      const toUpsert = telemetryRows.map(r => ({
        plate: r.plate,
        vehicle_label: r.vehicle_label,
        km_start: r.km_start,
        km_end: r.km_end,
        days_in_maintenance: r.days_in_maintenance,
        month_ref: monthDate,
        unit: r.unit,
        days_available: daysInMonth,
      }));

      const { error: upsertError } = await supabase
        .from("telemetry_readings")
        .upsert(toUpsert, { onConflict: "plate,month_ref" });

      if (upsertError) throw upsertError;

      // Fetch vehicles with franchise
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("plate, franchise_km");

      const franchiseMap = new Map<string, number>();
      vehicles?.forEach(v => franchiseMap.set(v.plate, v.franchise_km));

      // Fetch fuel logs for month to get km difference
      const monthStart = monthDate;
      const monthEnd = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;
      const { data: fuelLogs } = await supabase
        .from("fuel_logs")
        .select("plate, odometer, date")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: true });

      // Calculate fuel km per plate
      const fuelKmMap = new Map<string, number>();
      if (fuelLogs && fuelLogs.length > 0) {
        const byPlate = new Map<string, number[]>();
        fuelLogs.forEach(fl => {
          if (!byPlate.has(fl.plate)) byPlate.set(fl.plate, []);
          byPlate.get(fl.plate)!.push(fl.odometer);
        });
        byPlate.forEach((odos, plate) => {
          if (odos.length >= 2) {
            fuelKmMap.set(plate, Math.max(...odos) - Math.min(...odos));
          }
        });
      }

      // Fetch open work orders count per plate
      const { data: workOrders } = await supabase
        .from("work_orders")
        .select("plate, status")
        .in("status", ["open", "in_progress"]);

      const woCountMap = new Map<string, number>();
      workOrders?.forEach(wo => {
        woCountMap.set(wo.plate, (woCountMap.get(wo.plate) || 0) + 1);
      });

      // Build analysis
      const analysis: AnalysisResult[] = telemetryRows.map(tr => {
        const telemetryKm = tr.km_end - tr.km_start;
        const franchise = franchiseMap.get(tr.plate) || 5000;
        const fuelKm = fuelKmMap.get(tr.plate) ?? null;
        const effectiveDays = daysInMonth - tr.days_in_maintenance;
        const kmPerDay = effectiveDays > 0 ? telemetryKm / effectiveDays : 0;
        const projectedMonthly = kmPerDay * 30;

        const hasMaintJustification = tr.days_in_maintenance >= 7;
        const openWOs = woCountMap.get(tr.plate) || 0;

        let status: AnalysisResult["status"] = "within";
        let deviationPct = 0;

        if (telemetryKm < 4000 && !hasMaintJustification) {
          status = "underutilized";
          deviationPct = ((4000 - telemetryKm) / 4000) * 100;
        } else if (telemetryKm > franchise) {
          status = "over";
          deviationPct = ((telemetryKm - franchise) / franchise) * 100;
        } else {
          deviationPct = ((franchise - telemetryKm) / franchise) * 100;
        }

        return {
          plate: tr.plate,
          vehicle_label: tr.vehicle_label,
          unit: tr.unit,
          franchise_km: franchise,
          telemetry_km: telemetryKm,
          fuel_km: fuelKm,
          maintenance_days: tr.days_in_maintenance,
          effective_days: effectiveDays,
          km_per_effective_day: Math.round(kmPerDay),
          projected_monthly_km: Math.round(projectedMonthly),
          status,
          deviation_pct: Math.round(deviationPct),
          has_maintenance_justification: hasMaintJustification,
          open_work_orders: openWOs,
        };
      });

      analysis.sort((a, b) => a.telemetry_km - b.telemetry_km);
      setResults(analysis);
      setSummary({
        under: analysis.filter(a => a.status === "underutilized").length,
        within: analysis.filter(a => a.status === "within").length,
        over: analysis.filter(a => a.status === "over").length,
        total: analysis.length,
      });

      toast({ title: "Importação concluída", description: `${telemetryRows.length} veículos analisados.` });
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }, [monthRef, toast]);

  const chartData = results.length > 0
    ? [
        { name: "Subutilizados", value: summary?.under || 0, fill: "hsl(var(--warning))" },
        { name: "Dentro", value: summary?.within || 0, fill: "hsl(var(--success))" },
        { name: "Acima", value: summary?.over || 0, fill: "hsl(var(--critical))" },
      ]
    : [];

  const kmDiscrepancies = results.filter(r => r.fuel_km !== null && Math.abs(r.telemetry_km - (r.fuel_km || 0)) > 500);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-[11px] font-semibold text-info uppercase tracking-wider">
            Análise
          </span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Utilização da Frota</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cruzamento telemetria × abastecimento × manutenção — controle de franquia e subutilização
        </p>
      </div>

      {/* Import section */}
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-info" />
              Importar Dados de Telemetria
            </h3>
            <p className="text-xs text-muted-foreground">
              Envie um Excel com as colunas: <strong>Placa, Veículo, Km Início, Km Fim, Dias Manutenção, Unidade</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Mês referência</label>
              <input
                type="month"
                value={monthRef}
                onChange={(e) => setMonthRef(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
            <label className={`flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity ${importing ? "opacity-50 pointer-events-none" : ""}`}>
              <Upload className="h-4 w-4" />
              {importing ? "Importando..." : "Upload Excel"}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Results */}
      {summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase">Total Analisados</p>
              <p className="text-2xl font-bold text-foreground">{summary.total}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-warning" /> Subutilizados
              </p>
              <p className="text-2xl font-bold text-warning">{summary.under}</p>
              <p className="text-[10px] text-muted-foreground">&lt; 4.000 km/mês</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" /> Dentro da franquia
              </p>
              <p className="text-2xl font-bold text-success">{summary.within}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-critical" /> Acima da franquia
              </p>
              <p className="text-2xl font-bold text-critical">{summary.over}</p>
            </div>
          </div>

          {/* Chart + Discrepancies */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-card-foreground mb-4">Distribuição de Utilização</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Veículos" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {kmDiscrepancies.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
                <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Divergências Telemetria × Abastecimento
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Veículos com diferença &gt; 500 km entre as fontes (possível desvio de combustível ou erro de odômetro)
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                  {kmDiscrepancies.slice(0, 10).map(d => (
                    <div key={d.plate} className="flex items-center justify-between text-xs rounded-lg bg-card border border-border px-3 py-2">
                      <span className="font-mono font-semibold text-foreground">{d.plate}</span>
                      <span className="text-muted-foreground">Tel: {d.telemetry_km.toLocaleString("pt-BR")} km</span>
                      <span className="text-muted-foreground">Abast: {d.fuel_km?.toLocaleString("pt-BR")} km</span>
                      <span className="font-medium text-warning">Δ {Math.abs(d.telemetry_km - (d.fuel_km || 0)).toLocaleString("pt-BR")} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {kmDiscrepancies.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-4 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Info className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    As divergências telemetria × abastecimento aparecerão aqui quando houver dados de abastecimento no período
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Detail Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-card-foreground">Análise Detalhada por Veículo</h3>
              <p className="text-[11px] text-muted-foreground">
                Considera dias em manutenção para projeção ajustada. Veículos com 7+ dias em manutenção são justificados.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase">Placa</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Veículo</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">Unidade</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Km Telemetria</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Km Abast.</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase">Franquia</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">Dias Manut.</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden lg:table-cell">Km/Dia Efetivo</th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Projeção 30d</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">OS Abertas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => {
                    const sc = statusConfig[r.status];
                    const Icon = sc.icon;
                    return (
                      <tr key={r.plate} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-semibold text-foreground text-xs">{r.plate}</td>
                        <td className="px-3 py-2.5 text-xs text-foreground hidden md:table-cell">{r.vehicle_label}</td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">{r.unit}</td>
                        <td className="px-3 py-2.5 text-xs text-right font-medium text-foreground">{r.telemetry_km.toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-2.5 text-xs text-right text-muted-foreground hidden sm:table-cell">
                          {r.fuel_km !== null ? r.fuel_km.toLocaleString("pt-BR") : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-right text-muted-foreground">{r.franchise_km.toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-2.5 text-xs text-center hidden sm:table-cell">
                          {r.maintenance_days > 0 ? (
                            <span className={`font-medium ${r.has_maintenance_justification ? "text-info" : "text-muted-foreground"}`}>
                              {r.maintenance_days}d {r.has_maintenance_justification && <Wrench className="inline h-3 w-3" />}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-right text-muted-foreground hidden lg:table-cell">{r.km_per_effective_day}</td>
                        <td className="px-3 py-2.5 text-xs text-right font-medium text-foreground hidden md:table-cell">{r.projected_monthly_km.toLocaleString("pt-BR")}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${sc.className}`}>
                            <Icon className="h-3 w-3" />
                            <span className="hidden sm:inline">{sc.label}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-center hidden sm:table-cell">
                          {r.open_work_orders > 0 ? (
                            <span className="font-medium text-warning">{r.open_work_orders}</span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!summary && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma análise realizada</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Importe o Excel com os dados de telemetria do mês para cruzar com abastecimento e manutenção.
          </p>
        </div>
      )}
    </div>
  );
}
