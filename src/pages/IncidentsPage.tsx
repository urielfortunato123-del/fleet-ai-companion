import { useState, useMemo } from "react";
import {
  AlertTriangle, Search, Plus, Pencil, Trash2, ShieldAlert, Truck,
  Clock, CheckCircle2, DollarSign, Activity, AlertCircle, ChevronDown, ChevronUp
} from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import CrudDialog, { DeleteDialog } from "@/components/CrudDialog";
import { toast } from "sonner";
import {
  incidents as incidentsInit, incidentStats, incidentTypeLabels,
  Incident, IncidentType, IncidentSeverity, IncidentStatus,
} from "@/data/incidentsData";

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const severityConfig: Record<IncidentSeverity, { label: string; chip: string }> = {
  low: { label: "Baixa", chip: "low" },
  medium: { label: "Média", chip: "medium" },
  high: { label: "Alta", chip: "high" },
  critical: { label: "Crítica", chip: "critical" },
};

const statusConfig: Record<IncidentStatus, { label: string; chip: string }> = {
  open: { label: "Aberta", chip: "critical" },
  in_progress: { label: "Em Andamento", chip: "medium" },
  resolved: { label: "Resolvida", chip: "resolved" },
  closed: { label: "Encerrada", chip: "low" },
};

const incidentFields = [
  { name: "plate", label: "Placa", required: true, placeholder: "ABC-1D23" },
  { name: "driverName", label: "Motorista", required: true, placeholder: "Nome do motorista" },
  { name: "type", label: "Tipo", type: "select" as const, required: true, options: [
    { value: "accident", label: "Acidente" }, { value: "breakdown", label: "Pane Mecânica" },
    { value: "tow", label: "Reboque" }, { value: "theft", label: "Furto/Roubo" },
    { value: "vandalism", label: "Vandalismo" }, { value: "other", label: "Outro" },
  ]},
  { name: "severity", label: "Gravidade", type: "select" as const, required: true, options: [
    { value: "low", label: "Baixa" }, { value: "medium", label: "Média" },
    { value: "high", label: "Alta" }, { value: "critical", label: "Crítica" },
  ]},
  { name: "status", label: "Status", type: "select" as const, required: true, options: [
    { value: "open", label: "Aberta" }, { value: "in_progress", label: "Em Andamento" },
    { value: "resolved", label: "Resolvida" }, { value: "closed", label: "Encerrada" },
  ]},
  { name: "date", label: "Data", type: "date" as const, required: true },
  { name: "time", label: "Hora", required: true, placeholder: "14:30" },
  { name: "location", label: "Local", required: true, placeholder: "Rod. Anhanguera km 42, SP" },
  { name: "description", label: "Descrição", required: true, placeholder: "Descreva a ocorrência" },
  { name: "damageEstimate", label: "Estimativa Dano (R$)", type: "number" as const, required: true },
  { name: "policeReport", label: "Nº B.O.", placeholder: "BO-123456" },
  { name: "insuranceClaim", label: "Nº Sinistro", placeholder: "SIN-12345" },
];

export default function IncidentsPage() {
  const [data, setData] = useState<Incident[]>(incidentsInit);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; item?: Incident } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<IncidentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 15;

  const stats = useMemo(() => ({
    total: data.length,
    open: data.filter(i => i.status === "open").length,
    inProgress: data.filter(i => i.status === "in_progress").length,
    totalDamage: data.reduce((s, i) => s + i.damageEstimate, 0),
  }), [data]);

  const filtered = useMemo(() =>
    data.filter(i => {
      if (search && !i.plate.toLowerCase().includes(search.toLowerCase()) && !i.driverName.toLowerCase().includes(search.toLowerCase()) && !i.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      return true;
    }),
  [data, search, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSave = (values: Record<string, any>) => {
    if (dialog?.mode === "edit" && dialog.item) {
      setData(prev => prev.map(i => i.id === dialog.item!.id ? { ...i, ...values, damageEstimate: Number(values.damageEstimate) } as Incident : i));
      toast.success("Ocorrência atualizada");
    } else {
      const newIncident: Incident = {
        id: `OC-${String(data.length + 1).padStart(4, "0")}`,
        plate: values.plate,
        vehicleLabel: values.plate,
        unit: "",
        driverName: values.driverName,
        type: values.type,
        severity: values.severity,
        status: values.status,
        date: values.date,
        time: values.time,
        location: values.location,
        description: values.description,
        damageEstimate: Number(values.damageEstimate),
        hasInjury: false,
        policeReport: values.policeReport || undefined,
        insuranceClaim: values.insuranceClaim || undefined,
      };
      setData(prev => [newIncident, ...prev]);
      toast.success("Ocorrência registrada");
    }
    setDialog(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setData(prev => prev.filter(i => i.id !== deleteTarget.id));
      toast.success(`Ocorrência ${deleteTarget.id} excluída`);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Ocorrências</h1>
        <p className="text-sm text-muted-foreground">Registro de acidentes, panes, reboques e sinistros</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard title="Total Ocorrências" value={stats.total} icon={AlertTriangle} />
        <KPICard title="Abertas" value={stats.open} icon={AlertCircle} trend={{ value: stats.inProgress, label: "em andamento" }} />
        <KPICard title="Em Andamento" value={stats.inProgress} icon={Clock} />
        <KPICard title="Danos Estimados" value={fmtCurrency(stats.totalDamage)} icon={DollarSign} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar placa, motorista ou descrição..."
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as IncidentType | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos tipos</option>
          {Object.entries(incidentTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as IncidentStatus | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos status</option>
          <option value="open">Aberta</option>
          <option value="in_progress">Em Andamento</option>
          <option value="resolved">Resolvida</option>
          <option value="closed">Encerrada</option>
        </select>
        <button onClick={() => setDialog({ mode: "create" })} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Nova Ocorrência
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {paginated.map(inc => {
          const isExpanded = expandedId === inc.id;
          return (
            <div key={inc.id} className="rounded-lg border border-border bg-card overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : inc.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                  inc.severity === "critical" ? "bg-critical/10 text-critical" :
                  inc.severity === "high" ? "bg-warning/10 text-warning" :
                  "bg-info/10 text-info"
                }`}>
                  {inc.type === "accident" ? <ShieldAlert className="h-4 w-4" /> :
                   inc.type === "tow" ? <Truck className="h-4 w-4" /> :
                   <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-card-foreground">{inc.id}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{inc.plate}</span>
                    <StatusChip status={statusConfig[inc.status].chip as any} />
                    <StatusChip status={severityConfig[inc.severity].chip as any} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{inc.description} — {inc.driverName}</p>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <p className="text-sm font-bold text-card-foreground">{fmtCurrency(inc.damageEstimate)}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(inc.date).toLocaleDateString("pt-BR")} {inc.time}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setDialog({ mode: "edit", item: inc }); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(inc); }}
                    className="rounded-md p-1.5 text-muted-foreground hover:text-critical hover:bg-critical/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/10 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium text-foreground ml-1">{incidentTypeLabels[inc.type]}</span></div>
                    <div><span className="text-muted-foreground">Veículo:</span> <span className="font-medium text-foreground ml-1">{inc.vehicleLabel}</span></div>
                    <div><span className="text-muted-foreground">Unidade:</span> <span className="font-medium text-foreground ml-1">{inc.unit}</span></div>
                    <div><span className="text-muted-foreground">Local:</span> <span className="font-medium text-foreground ml-1">{inc.location}</span></div>
                    <div><span className="text-muted-foreground">Lesões:</span> <span className={`font-medium ml-1 ${inc.hasInjury ? "text-critical" : "text-success"}`}>{inc.hasInjury ? "Sim" : "Não"}</span></div>
                    {inc.policeReport && <div><span className="text-muted-foreground">B.O.:</span> <span className="font-medium text-foreground ml-1">{inc.policeReport}</span></div>}
                    {inc.insuranceClaim && <div><span className="text-muted-foreground">Sinistro:</span> <span className="font-medium text-foreground ml-1">{inc.insuranceClaim}</span></div>}
                    {inc.resolvedAt && <div><span className="text-muted-foreground">Resolvido em:</span> <span className="font-medium text-foreground ml-1">{new Date(inc.resolvedAt).toLocaleDateString("pt-BR")}</span></div>}
                  </div>
                  {inc.notes && <p className="text-xs text-muted-foreground italic">{inc.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{filtered.length} ocorrências encontradas</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted disabled:opacity-40">Anterior</button>
            <span className="text-[10px] text-foreground">{page}/{totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="rounded px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted disabled:opacity-40">Próxima</button>
          </div>
        )}
      </div>

      {/* CRUD Dialogs */}
      {dialog && (
        <CrudDialog title={dialog.mode === "create" ? "Nova Ocorrência" : `Editar ${dialog.item?.id}`}
          fields={incidentFields} initialValues={dialog.item || {}} onSave={handleSave} onClose={() => setDialog(null)} />
      )}
      {deleteTarget && (
        <DeleteDialog title="Excluir Ocorrência"
          message={`Excluir a ocorrência ${deleteTarget.id} - ${deleteTarget.plate} (${deleteTarget.description})?`}
          onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}
