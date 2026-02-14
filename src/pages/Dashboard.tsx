import {
  Car, Wrench, Fuel, AlertTriangle, TrendingDown, TrendingUp, DollarSign,
  Activity, AlertCircle, Gauge, Loader2
} from "lucide-react";
import KPICard from "@/components/KPICard";
import { useDashboardStats } from "@/hooks/useSupabaseData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-info" />
      </div>
    );
  }

  const noData = stats.totalVehicles === 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Executivo</h1>
          <p className="text-sm text-muted-foreground">Visão geral da frota — dados em tempo real</p>
        </div>
      </div>

      {noData && (
        <div className="rounded-xl border-2 border-dashed border-info/30 bg-info/5 p-6 text-center">
          <Car className="h-10 w-10 text-info mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum dado encontrado</h3>
          <p className="text-sm text-muted-foreground">
            Vá em <strong>Importar Dados</strong> no menu para carregar planilhas Excel, ou cadastre veículos manualmente.
          </p>
        </div>
      )}

      {/* KPIs row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Frota Total" value={stats.totalVehicles} subtitle={`${stats.activeVehicles} ativos`} icon={Car} variant="info" />
        <KPICard title="Custo Mensal" value={`R$ ${(stats.totalCostMonth / 1000).toFixed(0)}k`} subtitle={`R$ ${stats.avgCostPerKm}/km`} icon={DollarSign} variant="default" />
        <KPICard title="OS Abertas" value={stats.openWorkOrders} subtitle={`${stats.overdueWorkOrders} pendentes`} icon={AlertCircle} variant="critical" />
        <KPICard title="Score Médio" value={stats.avgHealthScore} subtitle="de 100 pontos" icon={Activity} variant="success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Em Manutenção" value={stats.inMaintenance} icon={Wrench} variant="warning" />
        <KPICard title="Parados" value={stats.stopped} icon={AlertTriangle} variant="critical" />
        <KPICard title="Consumo Médio" value={`${stats.avgFuelConsumption} km/l`} icon={Fuel} variant="default" />
        <KPICard title="Reserva" value={stats.reserve} icon={Gauge} variant="info" />
      </div>

      {!noData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Status pie */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Distribuição da Frota</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats.vehicleStatusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {stats.vehicleStatusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Cost by unit */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold text-card-foreground mb-4">Custo por Unidade</h3>
            <div className="space-y-3">
              {stats.costByUnit.map((unit) => (
                <div key={unit.name} className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{unit.name}</span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-info rounded-full transition-all"
                      style={{ width: `${stats.costByUnit[0]?.cost ? (unit.cost / stats.costByUnit[0].cost) * 100 : 0}%` }} />
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
      )}
    </div>
  );
}
