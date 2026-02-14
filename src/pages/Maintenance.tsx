import { useState, useMemo } from "react";
import {
  Wrench, Search, ChevronLeft, ChevronRight, Filter, Clock,
  CheckCircle2, XCircle, AlertCircle, DollarSign, Gauge, Calendar,
  FileText, ChevronDown, ChevronUp, Package, MapPin
} from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import {
  workOrders, maintenancePlans, scheduledServices, maintenanceStats,
  WorkOrder, ScheduledService, MaintenancePlan
} from "@/data/maintenanceData";

type Tab = "work-orders" | "schedule" | "plans";

const woStatusConfig: Record<string, { label: string; icon: typeof Clock }> = {
  open: { label: "Aberta", icon: AlertCircle },
  in_progress: { label: "Em Andamento", icon: Clock },
  done: { label: "Concluída", icon: CheckCircle2 },
  canceled: { label: "Cancelada", icon: XCircle },
};

const scheduleStatusConfig: Record<string, { label: string; className: string }> = {
  overdue: { label: "Vencido", className: "bg-critical/10 text-critical" },
  approaching: { label: "Próximo", className: "bg-warning/10 text-warning" },
  on_time: { label: "No prazo", className: "bg-success/10 text-success" },
};

const PAGE_SIZE = 15;

export default function Maintenance() {
  const [tab, setTab] = useState<Tab>("work-orders");
  const [woSearch, setWoSearch] = useState("");
  const [woStatus, setWoStatus] = useState("all");
  const [woType, setWoType] = useState("all");
  const [woUnit, setWoUnit] = useState("all");
  const [woPage, setWoPage] = useState(1);
  const [expandedWO, setExpandedWO] = useState<string | null>(null);
  const [schedFilter, setSchedFilter] = useState("all");
  const [schedSearch, setSchedSearch] = useState("");

  // Work Orders filtering
  const filteredWOs = useMemo(() => {
    return workOrders.filter(w => {
      const matchSearch = !woSearch ||
        w.id.toLowerCase().includes(woSearch.toLowerCase()) ||
        w.plate.toLowerCase().includes(woSearch.toLowerCase()) ||
        w.description.toLowerCase().includes(woSearch.toLowerCase()) ||
        w.supplier.toLowerCase().includes(woSearch.toLowerCase());
      const matchStatus = woStatus === "all" || w.status === woStatus;
      const matchType = woType === "all" || w.type === woType;
      const matchUnit = woUnit === "all" || w.unit === woUnit;
      return matchSearch && matchStatus && matchType && matchUnit;
    });
  }, [woSearch, woStatus, woType, woUnit]);

  const woTotalPages = Math.ceil(filteredWOs.length / PAGE_SIZE);
  const paginatedWOs = filteredWOs.slice((woPage - 1) * PAGE_SIZE, woPage * PAGE_SIZE);
  const units = [...new Set(workOrders.map(w => w.unit))];

  // Schedule filtering
  const filteredSchedule = useMemo(() => {
    return scheduledServices.filter(s => {
      const matchFilter = schedFilter === "all" || s.status === schedFilter;
      const matchSearch = !schedSearch ||
        s.plate.toLowerCase().includes(schedSearch.toLowerCase()) ||
        s.vehicleLabel.toLowerCase().includes(schedSearch.toLowerCase()) ||
        s.serviceType.toLowerCase().includes(schedSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [schedFilter, schedSearch]);

  const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "work-orders", label: "Ordens de Serviço", count: workOrders.length },
    { id: "schedule", label: "Agenda Preventiva", count: scheduledServices.length },
    { id: "plans", label: "Planos de Manutenção", count: maintenancePlans.length },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
        <p className="text-sm text-muted-foreground">Gestão de ordens de serviço, agenda preventiva e planos de manutenção</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="OS Abertas" value={maintenanceStats.openWOs} subtitle={`${maintenanceStats.inProgressWOs} em andamento`} icon={AlertCircle} variant="warning" />
        <KPICard title="Custo Mês" value={fmtCurrency(maintenanceStats.totalCostMonth)} subtitle="Fevereiro 2026" icon={DollarSign} variant="default" />
        <KPICard title="Preventivas Vencidas" value={maintenanceStats.overdueServices} subtitle={`${maintenanceStats.approachingServices} próximas`} icon={Clock} variant="critical" />
        <KPICard
          title="Custo Médio"
          value={fmtCurrency(maintenanceStats.avgCostPreventive)}
          subtitle={`Corretiva: ${fmtCurrency(maintenanceStats.avgCostCorrective)}`}
          icon={Wrench}
          variant="info"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                ${tab === t.id
                  ? "border-info text-info"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                  ${tab === t.id ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "work-orders" && (
        <WorkOrdersTab
          search={woSearch} setSearch={(v) => { setWoSearch(v); setWoPage(1); }}
          status={woStatus} setStatus={(v) => { setWoStatus(v); setWoPage(1); }}
          type={woType} setType={(v) => { setWoType(v); setWoPage(1); }}
          unit={woUnit} setUnit={(v) => { setWoUnit(v); setWoPage(1); }}
          units={units}
          filtered={filteredWOs}
          paginated={paginatedWOs}
          page={woPage} setPage={setWoPage}
          totalPages={woTotalPages}
          expandedWO={expandedWO} setExpandedWO={setExpandedWO}
          fmtCurrency={fmtCurrency}
        />
      )}

      {tab === "schedule" && (
        <ScheduleTab
          search={schedSearch} setSearch={setSchedSearch}
          filter={schedFilter} setFilter={setSchedFilter}
          filtered={filteredSchedule}
          fmtCurrency={fmtCurrency}
        />
      )}

      {tab === "plans" && <PlansTab plans={maintenancePlans} />}
    </div>
  );
}

/* ====== WORK ORDERS TAB ====== */
function WorkOrdersTab({
  search, setSearch, status, setStatus, type, setType, unit, setUnit,
  units, filtered, paginated, page, setPage, totalPages, expandedWO, setExpandedWO, fmtCurrency,
}: {
  search: string; setSearch: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  type: string; setType: (v: string) => void;
  unit: string; setUnit: (v: string) => void;
  units: string[];
  filtered: WorkOrder[];
  paginated: WorkOrder[];
  page: number; setPage: (v: number) => void;
  totalPages: number;
  expandedWO: string | null; setExpandedWO: (v: string | null) => void;
  fmtCurrency: (v: number) => string;
}) {
  return (
    <div className="space-y-4 animate-slide-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar OS, placa, descrição, fornecedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todos status</option>
          <option value="open">Aberta</option>
          <option value="in_progress">Em andamento</option>
          <option value="done">Concluída</option>
          <option value="canceled">Cancelada</option>
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todos tipos</option>
          <option value="preventive">Preventiva</option>
          <option value="corrective">Corretiva</option>
        </select>
        <select value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground hidden lg:block">
          <option value="all">Todas unidades</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} ordens encontradas</p>

      {/* WO List */}
      <div className="space-y-2">
        {paginated.map((wo) => {
          const isExpanded = expandedWO === wo.id;
          const StatusIcon = woStatusConfig[wo.status]?.icon || Clock;
          return (
            <div key={wo.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedWO(isExpanded ? null : wo.id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                {/* Status icon */}
                <div className={`shrink-0 ${wo.status === 'open' ? 'text-warning' : wo.status === 'in_progress' ? 'text-info' : wo.status === 'done' ? 'text-success' : 'text-muted-foreground'}`}>
                  <StatusIcon className="h-5 w-5" />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-card-foreground font-mono">{wo.id}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${wo.type === 'preventive' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
                      {wo.type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                    </span>
                    <StatusChip status={wo.status === 'in_progress' ? 'maintenance' : wo.status === 'open' ? 'open' : wo.status === 'done' ? 'resolved' : wo.status} />
                    {wo.priority === 'high' && <StatusChip status="high" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{wo.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{wo.plate}</span>
                    <span>{wo.vehicleLabel}</span>
                    <span className="hidden sm:inline">• {wo.unit}</span>
                  </div>
                </div>

                {/* Right side */}
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-bold text-card-foreground">{fmtCurrency(wo.cost_total)}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(wo.opened_at).toLocaleDateString("pt-BR")}</p>
                </div>

                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/20 animate-slide-in space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <InfoBlock label="Fornecedor" value={wo.supplier} icon={<MapPin className="h-3.5 w-3.5" />} />
                    <InfoBlock label="KM no Serviço" value={wo.km_at_service.toLocaleString("pt-BR")} icon={<Gauge className="h-3.5 w-3.5" />} />
                    <InfoBlock label="Abertura" value={new Date(wo.opened_at).toLocaleDateString("pt-BR")} icon={<Calendar className="h-3.5 w-3.5" />} />
                    <InfoBlock label="Fechamento" value={wo.closed_at ? new Date(wo.closed_at).toLocaleDateString("pt-BR") : "—"} icon={<CheckCircle2 className="h-3.5 w-3.5" />} />
                  </div>

                  {/* Parts */}
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                      <Package className="h-3.5 w-3.5" /> Peças e Serviços
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border">
                            <th className="px-3 py-2 text-left text-muted-foreground font-medium">Item</th>
                            <th className="px-3 py-2 text-center text-muted-foreground font-medium">Qtd</th>
                            <th className="px-3 py-2 text-right text-muted-foreground font-medium">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {wo.parts.map((p, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2 text-foreground">{p.name}</td>
                              <td className="px-3 py-2 text-center text-muted-foreground">{p.qty}</td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{fmtCurrency(p.cost)}</td>
                            </tr>
                          ))}
                          <tr className="bg-muted/30">
                            <td colSpan={2} className="px-3 py-2 font-semibold text-foreground">Total</td>
                            <td className="px-3 py-2 text-right font-bold text-foreground">{fmtCurrency(wo.cost_total)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
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
    </div>
  );
}

/* ====== SCHEDULE TAB ====== */
function ScheduleTab({
  search, setSearch, filter, setFilter, filtered, fmtCurrency,
}: {
  search: string; setSearch: (v: string) => void;
  filter: string; setFilter: (v: string) => void;
  filtered: ScheduledService[];
  fmtCurrency: (v: number) => string;
}) {
  return (
    <div className="space-y-4 animate-slide-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar placa, veículo ou serviço..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2">
          {(["all", "overdue", "approaching", "on_time"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-medium border transition-colors
                ${filter === f ? "border-info bg-info/10 text-info" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}>
              {f === "all" ? "Todos" : scheduleStatusConfig[f].label}
              <span className="ml-1.5 text-[10px]">
                ({f === "all" ? scheduledServices.length : scheduledServices.filter(s => s.status === f).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((svc) => {
          const cfg = scheduleStatusConfig[svc.status];
          return (
            <div key={svc.id}
              className={`rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm
                ${svc.status === "overdue" ? "border-l-4 border-l-critical border-t-border border-r-border border-b-border" :
                  svc.status === "approaching" ? "border-l-4 border-l-warning border-t-border border-r-border border-b-border" :
                  "border-border"}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-sm font-semibold text-card-foreground">{svc.serviceType}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-medium text-foreground">{svc.plate}</span>
                    <span className="text-[11px] text-muted-foreground">{svc.vehicleLabel}</span>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">Data Prevista</p>
                  <p className="text-xs font-medium text-foreground">{new Date(svc.dueDate).toLocaleDateString("pt-BR")}</p>
                  <p className={`text-[10px] font-medium ${svc.daysRemaining < 0 ? "text-critical" : svc.daysRemaining < 7 ? "text-warning" : "text-muted-foreground"}`}>
                    {svc.daysRemaining < 0 ? `${Math.abs(svc.daysRemaining)} dias atrás` : svc.daysRemaining === 0 ? "Hoje" : `Em ${svc.daysRemaining} dias`}
                  </p>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground uppercase">KM Restante</p>
                  <p className="text-xs font-medium text-foreground">{svc.kmRemaining.toLocaleString("pt-BR")} km</p>
                  <p className="text-[10px] text-muted-foreground">Atual: {svc.currentKm.toLocaleString("pt-BR")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">{svc.unit}</span>
                {svc.supplier ? (
                  <span className="text-[11px] text-muted-foreground">📍 {svc.supplier}</span>
                ) : (
                  <button className="text-[11px] text-info font-medium hover:underline">Agendar</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ====== PLANS TAB ====== */
function PlansTab({ plans }: { plans: MaintenancePlan[] }) {
  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{plans.length} planos configurados por marca/modelo</p>
        <button className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
          + Novo Plano
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-card-foreground">{plan.brand}</h4>
                <p className="text-xs text-muted-foreground">{plan.modelPattern}</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-medium text-info">
                {plan.vehicleCount} veículos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <PlanRule label="Troca de Óleo" value={`${(plan.oilChangeKm / 1000).toFixed(0)}k km / ${plan.oilChangeMonths}m`} />
              <PlanRule label="Revisão Geral" value={`${(plan.revisionKm / 1000).toFixed(0)}k km / ${plan.revisionMonths}m`} />
              <PlanRule label="Correia Dentada" value={`${(plan.beltChangeKm / 1000).toFixed(0)}k km`} />
              <PlanRule label="Revisão Freios" value={`${(plan.brakeCheckKm / 1000).toFixed(0)}k km`} />
              <PlanRule label="Rodízio Pneus" value={`${(plan.tireRotateKm / 1000).toFixed(0)}k km`} />
            </div>

            <div className="flex justify-end mt-3 pt-2 border-t border-border">
              <button className="text-[11px] text-info font-medium hover:underline">Editar plano</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====== Helper components ====== */
function InfoBlock({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card border border-border p-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}

function PlanRule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-medium text-foreground">{value}</p>
    </div>
  );
}
