import { useState, useMemo } from "react";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { vehiclesData, Vehicle } from "@/data/mockData";
import StatusChip from "@/components/StatusChip";
import HealthScore from "@/components/HealthScore";

const PAGE_SIZE = 20;

export default function Vehicles() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [unitFilter, setUnitFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return vehiclesData.filter((v) => {
      const matchSearch = !search || v.plate.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.brand.toLowerCase().includes(search.toLowerCase()) ||
        (v.driver && v.driver.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      const matchUnit = unitFilter === "all" || v.unit === unitFilter;
      return matchSearch && matchStatus && matchUnit;
    });
  }, [search, statusFilter, unitFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const units = [...new Set(vehiclesData.map(v => v.unit))];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} veículos encontrados</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar placa, modelo, marca ou motorista..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="stopped">Parados</option>
          <option value="maintenance">Manutenção</option>
          <option value="reserve">Reserva</option>
        </select>
        <select
          value={unitFilter}
          onChange={(e) => { setUnitFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground"
        >
          <option value="all">Todas as unidades</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
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
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">km/l</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-mono font-semibold text-foreground">{v.plate}</span>
                      <p className="text-[11px] text-muted-foreground sm:hidden">{v.brand} {v.model}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div>
                      <span className="text-foreground">{v.brand} {v.model}</span>
                      <p className="text-[11px] text-muted-foreground">{v.year} {v.driver ? `• ${v.driver}` : ""}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.unit}</td>
                  <td className="px-4 py-3"><StatusChip status={v.status} /></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex justify-center"><HealthScore score={v.healthScore} /></div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-muted-foreground hidden lg:table-cell">
                    {v.currentKm.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground hidden sm:table-cell">
                    R$ {v.costMonth.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">{v.fuelAvg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3 bg-muted/30">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page + i - 2;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors
                    ${pageNum === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
