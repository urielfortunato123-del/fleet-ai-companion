import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useVehicles, useInsertVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/useSupabaseData";
import { Tables } from "@/integrations/supabase/types";
import StatusChip from "@/components/StatusChip";
import HealthScore from "@/components/HealthScore";
import CrudDialog, { DeleteDialog } from "@/components/CrudDialog";
import { toast } from "sonner";

type Vehicle = Tables<"vehicles">;
const PAGE_SIZE = 20;

const units = ["Matriz SP", "Filial RJ", "Filial MG", "Filial BA", "Filial PR", "Filial GO", "Filial AM", "Filial PE"];
const statusOptions = [
  { value: "active", label: "Ativo" },
  { value: "stopped", label: "Parado" },
  { value: "maintenance", label: "Manutenção" },
  { value: "reserve", label: "Reserva" },
];

const vehicleFields = [
  { name: "plate", label: "Placa", required: true, placeholder: "ABC1D23" },
  { name: "brand", label: "Marca", required: true, placeholder: "Fiat" },
  { name: "model", label: "Modelo", required: true, placeholder: "Strada" },
  { name: "year", label: "Ano", type: "number" as const, required: true, placeholder: "2024" },
  { name: "unit", label: "Unidade", type: "select" as const, required: true, options: units.map(u => ({ value: u, label: u })) },
  { name: "status", label: "Status", type: "select" as const, required: true, options: statusOptions },
  { name: "current_km", label: "KM Atual", type: "number" as const, required: true, placeholder: "50000" },
  { name: "driver", label: "Motorista", placeholder: "Nome do motorista" },
  { name: "fuel_avg", label: "Consumo (km/l)", type: "number" as const, placeholder: "9.5" },
  { name: "cost_month", label: "Custo/Mês (R$)", type: "number" as const, placeholder: "2000" },
];

export default function Vehicles() {
  const { data: vehicles = [], isLoading } = useVehicles();
  const insertVehicle = useInsertVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; vehicle?: Vehicle } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch = !search || v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        (v.driver && v.driver.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      const matchUnit = unitFilter === "all" || v.unit === unitFilter;
      return matchSearch && matchStatus && matchUnit;
    });
  }, [vehicles, search, statusFilter, unitFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allUnits = [...new Set(vehicles.map(v => v.unit).filter(Boolean))];

  const handleSave = async (values: Record<string, any>) => {
    try {
      if (dialog?.mode === "edit" && dialog.vehicle) {
        await updateVehicle.mutateAsync({
          id: dialog.vehicle.id,
          plate: values.plate, brand: values.brand, model: values.model,
          year: Number(values.year), unit: values.unit, status: values.status,
          current_km: Number(values.current_km) || 0,
          driver: values.driver || null,
          fuel_avg: Number(values.fuel_avg) || 0,
          cost_month: Number(values.cost_month) || 0,
        });
        toast.success("Veículo atualizado com sucesso");
      } else {
        await insertVehicle.mutateAsync({
          plate: values.plate, brand: values.brand, model: values.model,
          year: Number(values.year), unit: values.unit || "Matriz SP",
          status: values.status || "active",
          current_km: Number(values.current_km) || 0,
          driver: values.driver || null,
          fuel_avg: Number(values.fuel_avg) || 9,
          cost_month: Number(values.cost_month) || 0,
        });
        toast.success("Veículo cadastrado com sucesso");
      }
      setDialog(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await deleteVehicle.mutateAsync(deleteTarget.id);
        toast.success(`Veículo ${deleteTarget.plate} excluído`);
        setDeleteTarget(null);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-info" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} veículos encontrados</p>
        </div>
        <button onClick={() => setDialog({ mode: "create" })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Novo Veículo
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Buscar placa, modelo, marca ou motorista..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="stopped">Parados</option>
          <option value="maintenance">Manutenção</option>
          <option value="reserve">Reserva</option>
        </select>
        <select value={unitFilter} onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground">
          <option value="all">Todas as unidades</option>
          {allUnits.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Placa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Veículo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Unidade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Score</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">KM Atual</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Custo/Mês</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                    <span className="font-mono font-semibold text-foreground">{v.plate}</span>
                    <p className="text-[11px] text-muted-foreground sm:hidden">{v.brand} {v.model}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell cursor-pointer" onClick={() => navigate(`/vehicles/${v.id}`)}>
                    <span className="text-foreground">{v.brand} {v.model}</span>
                    <p className="text-[11px] text-muted-foreground">{v.year} {v.driver ? `• ${v.driver}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.unit}</td>
                  <td className="px-4 py-3"><StatusChip status={v.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex justify-center"><HealthScore score={v.health_score} /></div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden lg:table-cell">{v.current_km.toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground hidden sm:table-cell">R$ {Number(v.cost_month).toLocaleString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setDialog({ mode: "edit", vehicle: v }); }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(v); }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-critical hover:bg-critical/10 transition-colors" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30">
            <span className="text-xs text-muted-foreground">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page + i - 2;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <button key={pageNum} onClick={() => setPage(pageNum)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${pageNum === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {pageNum}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {dialog && (
        <CrudDialog
          title={dialog.mode === "create" ? "Novo Veículo" : `Editar ${dialog.vehicle?.plate}`}
          fields={vehicleFields}
          initialValues={dialog.vehicle || {}}
          onSave={handleSave}
          onClose={() => setDialog(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          title="Excluir Veículo"
          message={`Tem certeza que deseja excluir o veículo ${deleteTarget.plate} (${deleteTarget.brand} ${deleteTarget.model})?`}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
