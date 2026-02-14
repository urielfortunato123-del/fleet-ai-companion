import {
  Car, Wrench, Fuel, AlertTriangle, TrendingDown, TrendingUp, DollarSign,
  Activity, AlertCircle, Gauge
} from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import { dashboardKPIs, costByMonth, costByUnit, vehicleStatusDistribution } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const formatCurrency = (v: number) =>
  `R$ ${(v / 1000).toFixed(0)}k`;

export default function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão geral da frota — Fevereiro 2026</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground">
            <option>Todas as unidades</option>
            <option>Matriz SP</option>
            <option>Filial RJ</option>
            <option>Filial MG</option>
          </select>
          <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Frota Total"
          value={dashboardKPIs.totalVehicles}
          subtitle={`${dashboardKPIs.activeVehicles} ativos`}
          icon={Car}
          variant="info"
        />
        <KPICard
          title="Custo Mensal"
          value={`R$ ${(dashboardKPIs.totalCostMonth / 1000000).toFixed(1)}M`}
          subtitle={`R$ ${dashboardKPIs.avgCostPerKm}/km`}
          icon={DollarSign}
          trend={{ value: -3.2, label: "vs mês anterior" }}
          variant="default"
        />
        <KPICard
          title="Alertas Abertos"
          value={dashboardKPIs.openAlerts}
          subtitle={`${dashboardKPIs.criticalAlerts} críticos`}
          icon={AlertCircle}
          variant="critical"
        />
        <KPICard
          title="Score Médio"
          value={dashboardKPIs.avgHealthScore}
          subtitle="de 100 pontos"
          icon={Activity}
          trend={{ value: 1.5, label: "vs mês anterior" }}
          variant="success"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Em Manutenção" value={dashboardKPIs.inMaintenance} icon={Wrench} variant="warning" />
        <KPICard title="Parados" value={dashboardKPIs.stopped} icon={AlertTriangle} variant="critical" />
        <KPICard title="Consumo Médio" value={`${dashboardKPIs.avgFuelConsumption} km/l`} icon={Fuel} variant="default" />
        <KPICard title="OS Abertas" value={dashboardKPIs.openWorkOrders} subtitle={`${dashboardKPIs.overdueWorkOrders} vencidas`} icon={Gauge} variant="warning" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost stacked bar */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Custos por Categoria (6 meses)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={costByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => `R$ ${(v / 1000).toFixed(0)}k`} />
              <Bar dataKey="manutencao" name="Manutenção" stackId="a" fill="hsl(var(--chart-1))" radius={[0, 0, 0, 0]} />
              <Bar dataKey="combustivel" name="Combustível" stackId="a" fill="hsl(var(--chart-2))" />
              <Bar dataKey="pneus" name="Pneus" stackId="a" fill="hsl(var(--chart-3))" />
              <Bar dataKey="multas" name="Multas" stackId="a" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Distribuição da Frota</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={vehicleStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="value"
                paddingAngle={3}
              >
                {vehicleStatusDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost by unit */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">Custo por Unidade</h3>
        <div className="space-y-3">
          {costByUnit.map((unit) => (
            <div key={unit.name} className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{unit.name}</span>
              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-info rounded-full transition-all"
                  style={{ width: `${(unit.cost / costByUnit[0].cost) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-20 text-right">
                R$ {(unit.cost / 1000).toFixed(0)}k
              </span>
              <span className="text-[10px] text-muted-foreground w-16 text-right">
                {unit.vehicles} veículos
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
