import {
  TrendingDown, TrendingUp, DollarSign, Car, Fuel, Wrench, AlertTriangle,
  Target, Download, ChevronDown, ChevronUp, Clock, BarChart3, PieChart as PieChartIcon,
  CheckCircle2, ArrowRight, Zap, FileText
} from "lucide-react";
import { useState } from "react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import HealthScore from "@/components/HealthScore";
import {
  top20Expensive, worstFuelEfficiency, stoppedVehicles, maintenanceVehicles,
  totalMonthlyCost, avgCostPerVehicle, healthDistribution, savingsOpportunities,
  totalProjectedSaving, savingPercentage, costProjection, unitComparison
} from "@/data/optimizationData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const fmt = (v: number) => `R$ ${(v / 1000).toLocaleString("pt-BR")}k`;
const fmtFull = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const difficultyConfig = {
  low: { label: "Fácil", className: "bg-success/10 text-success" },
  medium: { label: "Moderada", className: "bg-warning/10 text-warning" },
  high: { label: "Complexa", className: "bg-critical/10 text-critical" },
};

export default function OptimizationStudy() {
  const [expandedOpp, setExpandedOpp] = useState<string | null>("1");

  const healthPieData = [
    { name: "Excelente (80-100)", value: healthDistribution.excellent, color: "hsl(142, 71%, 45%)" },
    { name: "Bom (60-79)", value: healthDistribution.good, color: "hsl(217, 91%, 60%)" },
    { name: "Atenção (40-59)", value: healthDistribution.attention, color: "hsl(38, 92%, 50%)" },
    { name: "Crítico (<40)", value: healthDistribution.critical, color: "hsl(0, 72%, 51%)" },
  ];

  const unitRadar = unitComparison.slice(0, 5).map(u => ({
    unit: u.name.replace("Filial ", "").replace("Matriz ", ""),
    custoKm: Math.min(100, Math.round((u.costPerVehicle / 5000) * 100)),
    consumo: Math.min(100, Math.round(parseFloat(u.avgFuel) * 10)),
    saude: u.healthAvg,
    disponibilidade: Math.round(100 - parseFloat(u.stoppedPct)),
  }));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center rounded-full bg-info/10 px-2.5 py-0.5 text-[11px] font-semibold text-info uppercase tracking-wider">
              Estudo Estratégico
            </span>
            <span className="text-[11px] text-muted-foreground">14/02/2026</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Estudo de Otimização de Frota</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise completa com oportunidades de economia e plano de ação — 850 veículos
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <FileText className="h-3.5 w-3.5" />
            Exportar PDF
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
            <Download className="h-3.5 w-3.5" />
            Excel
          </button>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="rounded-xl border-2 border-info/20 bg-info/5 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-info" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Resumo Executivo</h2>
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          A análise identificou <strong>5 oportunidades principais</strong> de otimização com potencial
          de economia de <strong className="text-success">{fmtFull(totalProjectedSaving)}/mês</strong> ({savingPercentage}% do custo total).
          As ações de curto prazo (15-30 dias) representam <strong>42% da economia projetada</strong>.
          Recomenda-se priorizar a gestão de veículos parados e programa de eficiência de combustível.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-[11px] text-muted-foreground uppercase">Custo Atual/Mês</p>
            <p className="text-lg font-bold text-foreground">{fmt(totalMonthlyCost)}</p>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-[11px] text-muted-foreground uppercase">Economia Projetada</p>
            <p className="text-lg font-bold text-success">{fmt(totalProjectedSaving)}</p>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-[11px] text-muted-foreground uppercase">% Redução</p>
            <p className="text-lg font-bold text-info">{savingPercentage}%</p>
          </div>
          <div className="rounded-lg bg-card p-3 border border-border">
            <p className="text-[11px] text-muted-foreground uppercase">Custo/Veículo Médio</p>
            <p className="text-lg font-bold text-foreground">{fmtFull(avgCostPerVehicle)}</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cost projection */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Projeção de Custos (6 meses)</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Cenário atual vs. otimizado</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={costProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="atual" name="Cenário Atual" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="otimizado" name="Cenário Otimizado" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Health distribution */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-1">Distribuição de Saúde da Frota</h3>
          <p className="text-[11px] text-muted-foreground mb-4">{healthDistribution.critical + healthDistribution.attention} veículos precisam de atenção</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={healthPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {healthPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Opportunities */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-bold text-foreground">Oportunidades de Economia</h2>
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-[11px] font-bold text-success">
            {fmtFull(totalProjectedSaving)}/mês
          </span>
        </div>

        <div className="space-y-3">
          {savingsOpportunities.map((opp, i) => {
            const isExpanded = expandedOpp === opp.id;
            const diff = difficultyConfig[opp.difficulty];
            return (
              <div key={opp.id} className="rounded-lg border border-border bg-card overflow-hidden animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                <button
                  onClick={() => setExpandedOpp(isExpanded ? null : opp.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info font-bold text-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-card-foreground">{opp.category}</h4>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${diff.className}`}>
                        {diff.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" /> {opp.timeline}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{opp.description}</p>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-success">{fmt(opp.projectedSaving)}/mês</p>
                    <p className="text-[10px] text-muted-foreground">de {fmt(opp.currentCost)}</p>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/20 space-y-4 animate-slide-in">
                    <p className="text-sm text-foreground leading-relaxed">{opp.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Custo Atual</p>
                        <p className="text-base font-bold text-foreground">{fmtFull(opp.currentCost)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                      </div>
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Economia Projetada</p>
                        <p className="text-base font-bold text-success">{fmtFull(opp.projectedSaving)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
                      </div>
                      <div className="rounded-lg bg-card border border-border p-3">
                        <p className="text-[10px] text-muted-foreground uppercase">Economia Anual</p>
                        <p className="text-base font-bold text-info">{fmtFull(opp.projectedSaving * 12)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Plano de Ação:</p>
                      <div className="space-y-2">
                        {opp.actions.map((action, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-info shrink-0 mt-0.5" />
                            <span className="text-xs text-foreground">{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 20 most expensive */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-card-foreground">Top 20 Veículos Mais Caros do Mês</h3>
          <p className="text-[11px] text-muted-foreground">Ordenados por custo mensal — foco em corretivas e consumo</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Placa</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Veículo</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Unidade</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Score</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">km/l</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Custo/Mês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top20Expensive.map((v, i) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-muted-foreground font-medium">{i + 1}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-foreground text-xs">{v.plate}</td>
                  <td className="px-4 py-2.5 text-xs text-foreground hidden sm:table-cell">{v.brand} {v.model} {v.year}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{v.unit}</td>
                  <td className="px-4 py-2.5"><div className="flex justify-center"><HealthScore score={v.healthScore} /></div></td>
                  <td className="px-4 py-2.5 hidden md:table-cell text-center"><StatusChip status={v.status} /></td>
                  <td className="px-4 py-2.5 text-right text-xs hidden sm:table-cell">
                    <span className={v.fuelAvg < 7 ? "text-critical font-medium" : "text-muted-foreground"}>{v.fuelAvg}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-foreground">{fmtFull(v.costMonth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit comparison */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">Comparativo por Unidade</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Custo por veículo, consumo médio e disponibilidade</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">Unidade</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase">Veículos</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase">Custo Total</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase">Custo/Veíc.</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">km/l Médio</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase hidden sm:table-cell">% Parados</th>
                <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase hidden md:table-cell">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unitComparison.map(u => (
                <tr key={u.name} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5 text-xs font-medium text-foreground">{u.name}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-muted-foreground">{u.vehicles}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-medium text-foreground">{fmt(u.cost)}</td>
                  <td className="px-3 py-2.5 text-xs text-right font-medium text-foreground">{fmtFull(u.costPerVehicle)}</td>
                  <td className="px-3 py-2.5 text-xs text-right text-muted-foreground hidden sm:table-cell">{u.avgFuel}</td>
                  <td className="px-3 py-2.5 text-xs text-right hidden sm:table-cell">
                    <span className={parseFloat(u.stoppedPct) > 10 ? "text-critical font-medium" : "text-muted-foreground"}>
                      {u.stoppedPct}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell"><div className="flex justify-center"><HealthScore score={u.healthAvg} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worst fuel */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-1">15 Piores Consumidores de Combustível</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Veículos ativos com consumo abaixo da média (9.2 km/l)</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={worstFuelEfficiency} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 16]} unit=" km/l" />
            <YAxis dataKey="plate" type="category" width={75} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip formatter={(v: number) => `${v} km/l`} />
            <Bar dataKey="fuelAvg" name="Consumo (km/l)" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Estudo gerado em 14/02/2026 — Dados de referência: Janeiro-Fevereiro 2026 — 850 veículos analisados
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">
          FrotaSênior AI — Análise automatizada com validação de dados
        </p>
      </div>
    </div>
  );
}
