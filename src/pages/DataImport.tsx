import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2, Car, Wrench, Fuel, CircleDot, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

interface ImportModule {
  id: string;
  label: string;
  icon: typeof Car;
  table: string;
  columnMap: Record<string, string[]>; // db_column -> possible Excel column names
  requiredColumns: string[];
}

const modules: ImportModule[] = [
  {
    id: "vehicles", label: "Veículos", icon: Car, table: "vehicles",
    requiredColumns: ["plate", "brand", "model", "year"],
    columnMap: {
      plate: ["Placa", "placa", "PLACA", "plate"],
      brand: ["Marca", "marca", "MARCA", "brand"],
      model: ["Modelo", "modelo", "MODELO", "model"],
      year: ["Ano", "ano", "ANO", "year"],
      unit: ["Unidade", "unidade", "UNIDADE", "unit"],
      region: ["Região", "regiao", "REGIAO", "region"],
      status: ["Status", "status", "STATUS"],
      current_km: ["KM", "km", "Km Atual", "km_atual", "current_km", "Quilometragem"],
      health_score: ["Score", "score", "health_score", "Saúde"],
      cost_month: ["Custo Mês", "custo_mes", "cost_month", "Custo"],
      fuel_avg: ["Consumo", "consumo", "fuel_avg", "km/l"],
      driver: ["Motorista", "motorista", "driver", "Condutor"],
      franchise_km: ["Franquia KM", "franquia_km", "franchise_km", "Franquia"],
    },
  },
  {
    id: "work_orders", label: "Manutenção (OS)", icon: Wrench, table: "work_orders",
    requiredColumns: ["code", "plate"],
    columnMap: {
      code: ["Código", "codigo", "code", "OS", "Número OS"],
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label", "Descrição"],
      type: ["Tipo", "tipo", "type"],
      status: ["Status", "status"],
      opened_at: ["Data Abertura", "data_abertura", "opened_at", "Abertura"],
      closed_at: ["Data Fechamento", "data_fechamento", "closed_at", "Fechamento"],
      supplier: ["Fornecedor", "fornecedor", "supplier"],
      cost_total: ["Custo Total", "custo_total", "cost_total", "Custo", "Valor"],
      km_at_service: ["KM", "km", "km_at_service", "Km Serviço"],
      description: ["Descrição", "descricao", "description", "Serviço"],
      unit: ["Unidade", "unidade", "unit"],
      priority: ["Prioridade", "prioridade", "priority"],
    },
  },
  {
    id: "fuel_logs", label: "Combustível", icon: Fuel, table: "fuel_logs",
    requiredColumns: ["plate"],
    columnMap: {
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label"],
      date: ["Data", "data", "date"],
      liters: ["Litros", "litros", "liters", "Quantidade"],
      cost_per_liter: ["Preço/Litro", "preco_litro", "cost_per_liter", "Preço"],
      total_cost: ["Valor Total", "valor_total", "total_cost", "Valor"],
      odometer: ["KM", "km", "odometer", "Odômetro", "Quilometragem"],
      station: ["Posto", "posto", "station"],
      fuel_type: ["Combustível", "combustivel", "fuel_type", "Tipo"],
      driver: ["Motorista", "motorista", "driver"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
  {
    id: "tires", label: "Pneus", icon: CircleDot, table: "tires",
    requiredColumns: ["plate", "position", "brand", "model"],
    columnMap: {
      plate: ["Placa", "placa", "plate"],
      position: ["Posição", "posicao", "position"],
      brand: ["Marca", "marca", "brand"],
      model: ["Modelo", "modelo", "model"],
      size: ["Medida", "medida", "size", "Tamanho"],
      installed_at: ["Data Instalação", "data_instalacao", "installed_at"],
      installed_km: ["KM Instalação", "km_instalacao", "installed_km"],
      current_km: ["KM Atual", "km_atual", "current_km"],
      life_expected_km: ["Vida Esperada", "vida_esperada", "life_expected_km"],
      depth_mm: ["Profundidade", "profundidade", "depth_mm", "Sulco"],
      status: ["Status", "status"],
      cost_unit: ["Custo", "custo", "cost_unit", "Valor"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
  {
    id: "fines", label: "Multas", icon: FileText, table: "fines",
    requiredColumns: ["code", "plate", "infraction"],
    columnMap: {
      code: ["Código", "codigo", "code", "Auto"],
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label"],
      driver_name: ["Motorista", "motorista", "driver_name"],
      infraction: ["Infração", "infracao", "infraction"],
      severity: ["Gravidade", "gravidade", "severity"],
      status: ["Status", "status"],
      date: ["Data", "data", "date"],
      due_date: ["Vencimento", "vencimento", "due_date"],
      location: ["Local", "local", "location"],
      points: ["Pontos", "pontos", "points"],
      amount: ["Valor", "valor", "amount"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
  {
    id: "vehicle_documents", label: "Documentos", icon: FileText, table: "vehicle_documents",
    requiredColumns: ["code", "plate", "doc_type", "expiry_date"],
    columnMap: {
      code: ["Código", "codigo", "code"],
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label"],
      doc_type: ["Tipo", "tipo", "doc_type", "Tipo Doc"],
      description: ["Descrição", "descricao", "description"],
      issue_date: ["Emissão", "emissao", "issue_date"],
      expiry_date: ["Vencimento", "vencimento", "expiry_date", "Validade"],
      status: ["Status", "status"],
      responsible: ["Responsável", "responsavel", "responsible"],
      cost: ["Custo", "custo", "cost", "Valor"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
  {
    id: "incidents", label: "Ocorrências", icon: AlertTriangle, table: "incidents",
    requiredColumns: ["code", "plate"],
    columnMap: {
      code: ["Código", "codigo", "code"],
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label"],
      driver_name: ["Motorista", "motorista", "driver_name"],
      type: ["Tipo", "tipo", "type"],
      severity: ["Gravidade", "gravidade", "severity"],
      status: ["Status", "status"],
      date: ["Data", "data", "date"],
      time: ["Hora", "hora", "time"],
      location: ["Local", "local", "location"],
      description: ["Descrição", "descricao", "description"],
      damage_estimate: ["Valor Dano", "valor_dano", "damage_estimate", "Dano"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
];

function findColumn(excelHeaders: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const found = excelHeaders.find(h => h.trim().toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  return null;
}

export default function DataImport() {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ module: string; count: number; errors: string[] }[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, mod: ImportModule) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setSelectedModule(mod.id);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

      if (rows.length === 0) {
        toast({ title: "Arquivo vazio", variant: "destructive" });
        setImporting(false);
        return;
      }

      const headers = Object.keys(rows[0]);
      const mapping: Record<string, string> = {};
      const missingRequired: string[] = [];

      // Map columns
      for (const [dbCol, possibleNames] of Object.entries(mod.columnMap)) {
        const found = findColumn(headers, possibleNames);
        if (found) mapping[dbCol] = found;
      }

      // Check required
      for (const req of mod.requiredColumns) {
        if (!mapping[req]) missingRequired.push(req);
      }

      if (missingRequired.length > 0) {
        toast({
          title: "Colunas obrigatórias não encontradas",
          description: `Faltando: ${missingRequired.join(", ")}. Colunas encontradas: ${headers.join(", ")}`,
          variant: "destructive",
        });
        setImporting(false);
        return;
      }

      // Transform rows
      const dbRows = rows.map(row => {
        const dbRow: Record<string, any> = {};
        for (const [dbCol, excelCol] of Object.entries(mapping)) {
          let val = row[excelCol];
          if (val !== undefined && val !== null && val !== "") {
            // Type coercion
            if (["year", "current_km", "km_at_service", "odometer", "points", "installed_km", "life_expected_km", "health_score"].includes(dbCol)) {
              val = parseInt(String(val), 10) || 0;
            } else if (["cost_month", "fuel_avg", "cost_total", "liters", "cost_per_liter", "total_cost", "amount", "damage_estimate", "depth_mm", "cost_unit", "cost", "franchise_km"].includes(dbCol)) {
              val = parseFloat(String(val).replace(",", ".")) || 0;
            } else if (["has_injury"].includes(dbCol)) {
              val = val === true || val === "true" || val === "Sim" || val === "sim" || val === 1;
            } else {
              val = String(val).trim();
            }
            dbRow[dbCol] = val;
          }
        }
        return dbRow;
      }).filter(row => mod.requiredColumns.every(col => row[col]));

      if (dbRows.length === 0) {
        toast({ title: "Nenhum registro válido", description: "Todas as linhas foram filtradas por falta de dados obrigatórios.", variant: "destructive" });
        setImporting(false);
        return;
      }

      // Upsert in batches of 100
      const errors: string[] = [];
      const batchSize = 100;
      for (let i = 0; i < dbRows.length; i += batchSize) {
        const batch = dbRows.slice(i, i + batchSize);
        const { error } = await supabase.from(mod.table as any).upsert(batch as any);
        if (error) errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      }

      setResults(prev => [...prev, { module: mod.label, count: dbRows.length - errors.length, errors }]);
      queryClient.invalidateQueries();

      if (errors.length === 0) {
        toast({ title: `${mod.label} importado!`, description: `${dbRows.length} registros inseridos com sucesso.` });
      } else {
        toast({ title: `${mod.label} parcialmente importado`, description: `${dbRows.length - errors.length} OK, ${errors.length} erros.`, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      setSelectedModule(null);
      e.target.value = "";
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importar Dados</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça upload de planilhas Excel (.xlsx) para cada módulo. O sistema mapeia as colunas automaticamente.
        </p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          const result = results.find(r => r.module === mod.label);
          const isImporting = importing && selectedModule === mod.id;

          return (
            <div key={mod.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Icon className="h-5 w-5 text-info" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{mod.label}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    Obrigatório: {mod.requiredColumns.join(", ")}
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Colunas aceitas:</p>
                <p className="line-clamp-2">
                  {Object.entries(mod.columnMap).map(([db, names]) => names[0]).join(", ")}
                </p>
              </div>

              <label className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-3 text-sm font-medium cursor-pointer transition-colors hover:border-info hover:bg-info/5 ${isImporting ? "opacity-50 pointer-events-none" : ""}`}>
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-info" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">Upload Excel</span>
                  </>
                )}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImport(e, mod)} className="hidden" />
              </label>

              {result && (
                <div className={`rounded-lg p-3 text-xs ${result.errors.length === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  <div className="flex items-center gap-1.5">
                    {result.errors.length === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    <span className="font-medium">{result.count} registros importados</span>
                  </div>
                  {result.errors.length > 0 && (
                    <p className="mt-1 text-[10px]">{result.errors.length} erro(s)</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2 mb-3">
          <FileSpreadsheet className="h-4 w-4 text-info" />
          Dicas para a planilha
        </h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li>• Os dados devem estar na <strong className="text-foreground">primeira aba</strong> da planilha</li>
          <li>• A <strong className="text-foreground">primeira linha</strong> deve conter os nomes das colunas</li>
          <li>• Placas devem estar no formato <strong className="text-foreground">ABC1D23</strong> (sem traços)</li>
          <li>• Datas no formato <strong className="text-foreground">DD/MM/AAAA</strong> ou <strong className="text-foreground">AAAA-MM-DD</strong></li>
          <li>• Valores numéricos sem "R$" — apenas o número (ex: 1500.00)</li>
          <li>• Se um registro com a mesma chave já existir, ele será <strong className="text-foreground">atualizado</strong></li>
        </ul>
      </div>
    </div>
  );
}
