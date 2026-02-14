import { useState, useMemo } from "react";
import {
  FileText, Search, AlertTriangle, CheckCircle2, Clock, DollarSign,
  Plus, Pencil, Trash2, Shield, Calendar, Ban, CircleDot
} from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusChip from "@/components/StatusChip";
import CrudDialog, { DeleteDialog } from "@/components/CrudDialog";
import { toast } from "sonner";
import {
  fines as finesInit, vehicleDocs as docsInit, finesStats, docsStats, docTypeLabels,
  Fine, FineStatus, FineSeverity, VehicleDoc, DocType, DocStatus,
} from "@/data/finesDocsData";

const fmtCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const tabs = [
  { id: "fines", label: "Multas", icon: AlertTriangle },
  { id: "docs", label: "Documentos", icon: FileText },
] as const;
type TabId = typeof tabs[number]["id"];

const severityConfig: Record<FineSeverity, { label: string; chip: string }> = {
  light: { label: "Leve", chip: "low" },
  medium: { label: "Média", chip: "medium" },
  serious: { label: "Grave", chip: "high" },
  very_serious: { label: "Gravíssima", chip: "critical" },
};

const fineStatusConfig: Record<FineStatus, { label: string; chip: string }> = {
  pending: { label: "Pendente", chip: "medium" },
  paid: { label: "Paga", chip: "resolved" },
  contested: { label: "Contestada", chip: "low" },
  canceled: { label: "Cancelada", chip: "low" },
};

const docStatusConfig: Record<DocStatus, { label: string; chip: string }> = {
  valid: { label: "Vigente", chip: "resolved" },
  expiring: { label: "Vencendo", chip: "medium" },
  expired: { label: "Vencido", chip: "critical" },
};

/* ===== FINE FIELDS ===== */
const fineFields = [
  { name: "plate", label: "Placa", required: true, placeholder: "ABC-1D23" },
  { name: "driverName", label: "Motorista", required: true, placeholder: "Nome do motorista" },
  { name: "infraction", label: "Infração", required: true, placeholder: "Descrição da infração" },
  { name: "severity", label: "Gravidade", type: "select" as const, required: true, options: [
    { value: "light", label: "Leve" }, { value: "medium", label: "Média" },
    { value: "serious", label: "Grave" }, { value: "very_serious", label: "Gravíssima" },
  ]},
  { name: "status", label: "Status", type: "select" as const, required: true, options: [
    { value: "pending", label: "Pendente" }, { value: "paid", label: "Paga" },
    { value: "contested", label: "Contestada" }, { value: "canceled", label: "Cancelada" },
  ]},
  { name: "date", label: "Data da Infração", type: "date" as const, required: true },
  { name: "dueDate", label: "Vencimento", type: "date" as const, required: true },
  { name: "location", label: "Local", required: true, placeholder: "Cidade - UF" },
  { name: "points", label: "Pontos", type: "number" as const, required: true },
  { name: "amount", label: "Valor (R$)", type: "number" as const, required: true },
  { name: "autoNumber", label: "Nº Auto", required: true, placeholder: "123456" },
];

/* ===== DOC FIELDS ===== */
const docFields = [
  { name: "plate", label: "Placa", required: true, placeholder: "ABC-1D23" },
  { name: "docType", label: "Tipo", type: "select" as const, required: true, options: [
    { value: "crlv", label: "CRLV" }, { value: "ipva", label: "IPVA" },
    { value: "seguro", label: "Seguro" }, { value: "licenciamento", label: "Licenciamento" },
    { value: "laudo_vistoria", label: "Laudo Vistoria" }, { value: "contrato", label: "Contrato" },
  ]},
  { name: "status", label: "Status", type: "select" as const, required: true, options: [
    { value: "valid", label: "Vigente" }, { value: "expiring", label: "Vencendo" }, { value: "expired", label: "Vencido" },
  ]},
  { name: "issueDate", label: "Data Emissão", type: "date" as const, required: true },
  { name: "expiryDate", label: "Data Vencimento", type: "date" as const, required: true },
  { name: "responsible", label: "Responsável", required: true, placeholder: "Setor responsável" },
  { name: "cost", label: "Custo (R$)", type: "number" as const, placeholder: "0" },
  { name: "notes", label: "Observações", placeholder: "Notas adicionais" },
];

export default function FinesDocsPage() {
  const [tab, setTab] = useState<TabId>("fines");

  /* Fines state */
  const [fineData, setFineData] = useState<Fine[]>(finesInit);
  const [fineDialog, setFineDialog] = useState<{ mode: "create" | "edit"; item?: Fine } | null>(null);
  const [fineDeleteTarget, setFineDeleteTarget] = useState<Fine | null>(null);

  /* Docs state */
  const [docData, setDocData] = useState<VehicleDoc[]>(docsInit);
  const [docDialog, setDocDialog] = useState<{ mode: "create" | "edit"; item?: VehicleDoc } | null>(null);
  const [docDeleteTarget, setDocDeleteTarget] = useState<VehicleDoc | null>(null);

  /* Fine stats (reactive) */
  const fStats = useMemo(() => ({
    total: fineData.length,
    pending: fineData.filter(f => f.status === "pending").length,
    pendingAmount: fineData.filter(f => f.status === "pending").reduce((s, f) => s + f.amount, 0),
    totalPoints: fineData.reduce((s, f) => s + f.points, 0),
  }), [fineData]);

  const dStats = useMemo(() => ({
    total: docData.length,
    valid: docData.filter(d => d.status === "valid").length,
    expiring: docData.filter(d => d.status === "expiring").length,
    expired: docData.filter(d => d.status === "expired").length,
  }), [docData]);

  /* Fine CRUD */
  const handleFineSave = (values: Record<string, any>) => {
    if (fineDialog?.mode === "edit" && fineDialog.item) {
      setFineData(prev => prev.map(f => f.id === fineDialog.item!.id ? { ...f, ...values } as Fine : f));
      toast.success("Multa atualizada");
    } else {
      const newFine: Fine = {
        id: `MULTA-${String(fineData.length + 1).padStart(4, "0")}`,
        plate: values.plate,
        vehicleLabel: values.plate,
        unit: "",
        driverName: values.driverName,
        infraction: values.infraction,
        severity: values.severity,
        status: values.status,
        date: values.date,
        dueDate: values.dueDate,
        location: values.location,
        points: Number(values.points),
        amount: Number(values.amount),
        autoNumber: values.autoNumber,
      };
      setFineData(prev => [newFine, ...prev]);
      toast.success("Multa cadastrada");
    }
    setFineDialog(null);
  };

  const handleFineDelete = () => {
    if (fineDeleteTarget) {
      setFineData(prev => prev.filter(f => f.id !== fineDeleteTarget.id));
      toast.success(`Multa ${fineDeleteTarget.id} excluída`);
      setFineDeleteTarget(null);
    }
  };

  /* Doc CRUD */
  const handleDocSave = (values: Record<string, any>) => {
    if (docDialog?.mode === "edit" && docDialog.item) {
      setDocData(prev => prev.map(d => d.id === docDialog.item!.id ? { ...d, ...values } as VehicleDoc : d));
      toast.success("Documento atualizado");
    } else {
      const newDoc: VehicleDoc = {
        id: `DOC-${String(docData.length + 1).padStart(4, "0")}`,
        plate: values.plate,
        vehicleLabel: values.plate,
        unit: "",
        docType: values.docType,
        description: docTypeLabels[values.docType as DocType],
        issueDate: values.issueDate,
        expiryDate: values.expiryDate,
        status: values.status,
        responsible: values.responsible,
        cost: values.cost ? Number(values.cost) : undefined,
        notes: values.notes || undefined,
      };
      setDocData(prev => [newDoc, ...prev]);
      toast.success("Documento cadastrado");
    }
    setDocDialog(null);
  };

  const handleDocDelete = () => {
    if (docDeleteTarget) {
      setDocData(prev => prev.filter(d => d.id !== docDeleteTarget.id));
      toast.success(`Documento ${docDeleteTarget.id} excluído`);
      setDocDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Multas & Documentos</h1>
        <p className="text-sm text-muted-foreground">Gestão de multas, vencimentos, documentação veicular e compliance</p>
      </div>

      {/* KPIs */}
      {tab === "fines" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard title="Total Multas" value={fStats.total} icon={AlertTriangle} />
          <KPICard title="Pendentes" value={fStats.pending} icon={Clock} trend={{ value: fStats.pending, label: "aguardando" }} />
          <KPICard title="Valor Pendente" value={fmtCurrency(fStats.pendingAmount)} icon={DollarSign} />
          <KPICard title="Pontos Acum." value={fStats.totalPoints} icon={Ban} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPICard title="Total Docs" value={dStats.total} icon={FileText} />
          <KPICard title="Vigentes" value={dStats.valid} icon={CheckCircle2} />
          <KPICard title="Vencendo" value={dStats.expiring} icon={Clock} trend={{ value: dStats.expiring, label: "próx. 30d" }} />
          <KPICard title="Vencidos" value={dStats.expired} icon={AlertTriangle} />
        </div>
      )}

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

      {tab === "fines" && (
        <FinesTab data={fineData}
          onNew={() => setFineDialog({ mode: "create" })}
          onEdit={(f) => setFineDialog({ mode: "edit", item: f })}
          onDelete={(f) => setFineDeleteTarget(f)} />
      )}
      {tab === "docs" && (
        <DocsTab data={docData}
          onNew={() => setDocDialog({ mode: "create" })}
          onEdit={(d) => setDocDialog({ mode: "edit", item: d })}
          onDelete={(d) => setDocDeleteTarget(d)} />
      )}

      {/* CRUD Dialogs */}
      {fineDialog && (
        <CrudDialog title={fineDialog.mode === "create" ? "Nova Multa" : `Editar ${fineDialog.item?.id}`}
          fields={fineFields} initialValues={fineDialog.item || {}} onSave={handleFineSave} onClose={() => setFineDialog(null)} />
      )}
      {fineDeleteTarget && (
        <DeleteDialog title="Excluir Multa"
          message={`Excluir a multa ${fineDeleteTarget.id} - ${fineDeleteTarget.plate} (${fineDeleteTarget.infraction})?`}
          onConfirm={handleFineDelete} onClose={() => setFineDeleteTarget(null)} />
      )}
      {docDialog && (
        <CrudDialog title={docDialog.mode === "create" ? "Novo Documento" : `Editar ${docDialog.item?.id}`}
          fields={docFields} initialValues={docDialog.item || {}} onSave={handleDocSave} onClose={() => setDocDialog(null)} />
      )}
      {docDeleteTarget && (
        <DeleteDialog title="Excluir Documento"
          message={`Excluir o documento ${docDeleteTarget.id} - ${docDeleteTarget.plate} (${docDeleteTarget.description})?`}
          onConfirm={handleDocDelete} onClose={() => setDocDeleteTarget(null)} />
      )}
    </div>
  );
}

/* ===== FINES TAB ===== */
function FinesTab({ data, onNew, onEdit, onDelete }: {
  data: Fine[]; onNew: () => void; onEdit: (f: Fine) => void; onDelete: (f: Fine) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FineStatus | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<FineSeverity | "all">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = useMemo(() =>
    data.filter(f => {
      if (search && !f.plate.toLowerCase().includes(search.toLowerCase()) && !f.driverName.toLowerCase().includes(search.toLowerCase()) && !f.infraction.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && f.status !== statusFilter) return false;
      if (severityFilter !== "all" && f.severity !== severityFilter) return false;
      return true;
    }),
  [data, search, statusFilter, severityFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar placa, motorista ou infração..."
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as FineStatus | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos status</option>
          <option value="pending">Pendente</option>
          <option value="paid">Paga</option>
          <option value="contested">Contestada</option>
          <option value="canceled">Cancelada</option>
        </select>
        <select value={severityFilter} onChange={e => { setSeverityFilter(e.target.value as FineSeverity | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todas gravidades</option>
          <option value="light">Leve</option>
          <option value="medium">Média</option>
          <option value="serious">Grave</option>
          <option value="very_serious">Gravíssima</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Nova Multa
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Data","Placa","Motorista","Infração","Gravidade","Pontos","Valor","Status","Vencimento","Ações"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map(f => (
                <tr key={f.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-foreground">{new Date(f.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2 font-mono font-medium text-foreground">{f.plate}</td>
                  <td className="px-3 py-2 text-foreground">{f.driverName}</td>
                  <td className="px-3 py-2 text-foreground max-w-[200px] truncate">{f.infraction}</td>
                  <td className="px-3 py-2"><StatusChip status={severityConfig[f.severity].chip as any} /></td>
                  <td className="px-3 py-2 text-foreground font-bold">{f.points}</td>
                  <td className="px-3 py-2 text-foreground">{fmtCurrency(f.amount)}</td>
                  <td className="px-3 py-2"><StatusChip status={fineStatusConfig[f.status].chip as any} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(f.dueDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(f)} className="rounded-md p-1 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => onDelete(f)} className="rounded-md p-1 text-muted-foreground hover:text-critical hover:bg-critical/10 transition-colors"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">{filtered.length} multas encontradas</span>
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
      </div>
    </div>
  );
}

/* ===== DOCS TAB ===== */
function DocsTab({ data, onNew, onEdit, onDelete }: {
  data: VehicleDoc[]; onNew: () => void; onEdit: (d: VehicleDoc) => void; onDelete: (d: VehicleDoc) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filtered = useMemo(() =>
    data.filter(d => {
      if (search && !d.plate.toLowerCase().includes(search.toLowerCase()) && !d.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (typeFilter !== "all" && d.docType !== typeFilter) return false;
      return true;
    }),
  [data, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar placa ou tipo..."
            className="w-full rounded-lg border border-border bg-card pl-8 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground" />
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as DocType | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos tipos</option>
          {Object.entries(docTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as DocStatus | "all"); setPage(1); }}
          className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground">
          <option value="all">Todos status</option>
          <option value="valid">Vigente</option>
          <option value="expiring">Vencendo</option>
          <option value="expired">Vencido</option>
        </select>
        <button onClick={onNew} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" /> Novo Documento
        </button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Placa","Tipo","Emissão","Vencimento","Status","Responsável","Custo","Obs","Ações"].map(h =>
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map(d => (
                <tr key={d.id} className={`border-b border-border hover:bg-muted/20 transition-colors ${d.status === "expired" ? "bg-critical/5" : d.status === "expiring" ? "bg-warning/5" : ""}`}>
                  <td className="px-3 py-2 font-mono font-medium text-foreground">{d.plate}</td>
                  <td className="px-3 py-2 text-foreground">{d.description}</td>
                  <td className="px-3 py-2 text-muted-foreground">{new Date(d.issueDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2 text-foreground">{new Date(d.expiryDate).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2"><StatusChip status={docStatusConfig[d.status].chip as any} /></td>
                  <td className="px-3 py-2 text-muted-foreground">{d.responsible}</td>
                  <td className="px-3 py-2 text-foreground">{d.cost ? fmtCurrency(d.cost) : "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[120px] truncate">{d.notes || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onEdit(d)} className="rounded-md p-1 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"><Pencil className="h-3 w-3" /></button>
                      <button onClick={() => onDelete(d)} className="rounded-md p-1 text-muted-foreground hover:text-critical hover:bg-critical/10 transition-colors"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground">{filtered.length} documentos encontrados</span>
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
      </div>
    </div>
  );
}
