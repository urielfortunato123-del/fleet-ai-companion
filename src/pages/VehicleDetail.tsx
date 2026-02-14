import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Car, Fuel, Wrench, CircleDot, FileText, AlertTriangle,
  DollarSign, Gauge, Calendar, MapPin, User, Hash, Activity,
  Clock, CheckCircle2, XCircle, AlertCircle, Shield
} from "lucide-react";
import StatusChip from "@/components/StatusChip";
import HealthScore from "@/components/HealthScore";
import { getVehicleDetail, getVehicleCostSummary, TimelineEvent, TimelineEventType } from "@/data/vehicleDetailData";

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const eventTypeConfig: Record<TimelineEventType, { icon: typeof Wrench; color: string; bgColor: string; label: string }> = {
  maintenance: { icon: Wrench, color: "text-info", bgColor: "bg-info/10", label: "Manutenção" },
  fuel: { icon: Fuel, color: "text-success", bgColor: "bg-success/10", label: "Combustível" },
  tire: { icon: CircleDot, color: "text-warning", bgColor: "bg-warning/10", label: "Pneus" },
  fine: { icon: AlertTriangle, color: "text-critical", bgColor: "bg-critical/10", label: "Multa" },
  incident: { icon: AlertCircle, color: "text-critical", bgColor: "bg-critical/10", label: "Ocorrência" },
  document: { icon: FileText, color: "text-muted-foreground", bgColor: "bg-muted", label: "Documento" },
};

const healthCategoryConfig = [
  { key: "maintenance" as const, icon: Wrench, label: "Manutenção" },
  { key: "fuel" as const, icon: Fuel, label: "Combustível" },
  { key: "tires" as const, icon: CircleDot, label: "Pneus" },
  { key: "documents" as const, icon: FileText, label: "Documentos" },
  { key: "incidents" as const, icon: Shield, label: "Ocorrências" },
];

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const data = id ? getVehicleDetail(id) : null;
  const costs = id ? getVehicleCostSummary(id) : null;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] p-6">
        <p className="text-lg font-bold text-foreground">Veículo não encontrado</p>
        <button onClick={() => navigate("/vehicles")} className="mt-4 text-sm text-info hover:underline">Voltar para lista</button>
      </div>
    );
  }

  const { vehicle, health, timeline } = data;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate("/vehicles")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para veículos
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Car className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground font-mono">{vehicle.plate}</h1>
              <StatusChip status={vehicle.status} size="md" />
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{vehicle.brand} {vehicle.model} {vehicle.year} — {vehicle.unit}</p>
          </div>
          <div className="shrink-0">
            <HealthScore score={vehicle.healthScore} size="lg" />
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <InfoCard icon={<Gauge className="h-4 w-4" />} label="KM Atual" value={vehicle.currentKm.toLocaleString("pt-BR")} />
        <InfoCard icon={<Fuel className="h-4 w-4" />} label="Consumo" value={`${vehicle.fuelAvg} km/l`} />
        <InfoCard icon={<DollarSign className="h-4 w-4" />} label="Custo/Mês" value={fmtCurrency(vehicle.costMonth)} />
        <InfoCard icon={<User className="h-4 w-4" />} label="Motorista" value={vehicle.driver || "Sem atribuição"} />
        <InfoCard icon={<MapPin className="h-4 w-4" />} label="Unidade" value={vehicle.unit} />
        <InfoCard icon={<Calendar className="h-4 w-4" />} label="Próx. Manutenção" value={new Date(vehicle.nextMaintenance).toLocaleDateString("pt-BR")} />
      </div>

      {/* Main content: Health + Costs | Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Health breakdown */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-info" />
              <h3 className="text-sm font-bold text-card-foreground">Score de Saúde</h3>
            </div>

            <div className="flex items-center justify-center mb-5">
              <HealthScore score={health.overall} size="lg" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-foreground">{health.overall}/100</p>
                <p className="text-xs text-muted-foreground">
                  {health.overall >= 70 ? "Bom estado geral" : health.overall >= 40 ? "Requer atenção" : "Estado crítico"}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {healthCategoryConfig.map(cat => {
                const data = health[cat.key];
                const Icon = cat.icon;
                const color = data.score >= 70 ? "text-success" : data.score >= 40 ? "text-warning" : "text-critical";
                const barColor = data.score >= 70 ? "bg-success" : data.score >= 40 ? "bg-warning" : "bg-critical";
                return (
                  <div key={cat.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                        <span className="text-xs font-medium text-foreground">{cat.label}</span>
                      </div>
                      <span className={`text-xs font-bold ${color}`}>{data.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-1">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${data.score}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{data.label} — {data.details}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost summary */}
          {costs && (
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-warning" />
                <h3 className="text-sm font-bold text-card-foreground">Resumo de Custos</h3>
              </div>
              <div className="space-y-3">
                <CostRow label="Combustível" value={costs.fuelTotal} sub={`${costs.fuelCount} abastecimentos`} />
                <CostRow label="Manutenção" value={costs.maintenanceTotal} sub={`${costs.preventiveCount} preventivas, ${costs.correctiveCount} corretivas`} />
                <div className="border-t border-border pt-3">
                  <CostRow label="Total Registrado" value={costs.fuelTotal + costs.maintenanceTotal} bold />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-info" />
                <h3 className="text-sm font-bold text-card-foreground">Linha do Tempo</h3>
              </div>
              <span className="text-xs text-muted-foreground">{timeline.length} eventos</span>
            </div>

            {/* Filter chips */}
            <TimelineFiltered timeline={timeline} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Timeline with filters */
import { useState } from "react";

function TimelineFiltered({ timeline }: { timeline: TimelineEvent[] }) {
  const [filter, setFilter] = useState<TimelineEventType | "all">("all");

  const types: (TimelineEventType | "all")[] = ["all", "maintenance", "fuel", "tire", "fine", "incident", "document"];
  const filtered = filter === "all" ? timeline : timeline.filter(e => e.type === filter);

  return (
    <>
      <div className="flex gap-1.5 flex-wrap mb-4">
        {types.map(t => {
          const cfg = t === "all" ? null : eventTypeConfig[t];
          const count = t === "all" ? timeline.length : timeline.filter(e => e.type === t).length;
          if (t !== "all" && count === 0) return null;
          return (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors border
                ${filter === t ? "border-info bg-info/10 text-info" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
              {t === "all" ? "Todos" : cfg!.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

        <div className="space-y-1">
          {filtered.map((event, i) => {
            const cfg = eventTypeConfig[event.type];
            const Icon = cfg.icon;
            const prevDate = i > 0 ? filtered[i - 1].date : null;
            const showDate = !prevDate || prevDate !== event.date;

            return (
              <div key={event.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-2 pl-9">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                )}
                <div className="flex gap-3 group animate-slide-in">
                  {/* Dot */}
                  <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${cfg.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-lg border border-border bg-card p-3 group-hover:bg-muted/30 transition-colors mb-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-card-foreground">{event.title}</span>
                          {event.status && (
                            <StatusChip status={event.status === "done" ? "resolved" : event.status === "in_progress" ? "maintenance" : event.status} />
                          )}
                          {event.severity && <StatusChip status={event.severity} />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{event.description}</p>
                        {event.metadata && (
                          <div className="flex gap-3 mt-1.5 flex-wrap">
                            {Object.entries(event.metadata).map(([k, v]) => (
                              <span key={k} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                <span className="font-medium text-foreground/70 uppercase">{k}:</span> {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {event.cost !== undefined && (
                        <span className="text-xs font-bold text-foreground shrink-0">{fmtCurrency(event.cost)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* Helper components */
function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-xs font-medium text-foreground truncate">{value}</p>
    </div>
  );
}

function CostRow({ label, value, sub, bold }: { label: string; value: number; sub?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-xs ${bold ? "font-bold text-foreground" : "text-foreground"}`}>{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <p className={`text-xs ${bold ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{fmtCurrency(value)}</p>
    </div>
  );
}
