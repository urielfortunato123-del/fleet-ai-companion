import { useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { importModules, findColumn, coerceValue, type ImportModule } from "@/data/importModules";

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

      for (const [dbCol, possibleNames] of Object.entries(mod.columnMap)) {
        const found = findColumn(headers, possibleNames);
        if (found) mapping[dbCol] = found;
      }

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

      const dbRows = rows.map(row => {
        const dbRow: Record<string, any> = {};
        for (const [dbCol, excelCol] of Object.entries(mapping)) {
          const val = coerceValue(dbCol, row[excelCol]);
          if (val !== undefined) dbRow[dbCol] = val;
        }
        return dbRow;
      }).filter(row => mod.requiredColumns.every(col => row[col]));

      if (dbRows.length === 0) {
        toast({ title: "Nenhum registro válido", description: "Todas as linhas foram filtradas por falta de dados obrigatórios.", variant: "destructive" });
        setImporting(false);
        return;
      }

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {importModules.map((mod) => {
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
                  <><Loader2 className="h-4 w-4 animate-spin text-info" />Importando...</>
                ) : (
                  <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-foreground">Upload Excel</span></>
                )}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleImport(e, mod)} className="hidden" />
              </label>

              {result && (
                <div className={`rounded-lg p-3 text-xs ${result.errors.length === 0 ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                  <div className="flex items-center gap-1.5">
                    {result.errors.length === 0 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    <span className="font-medium">{result.count} registros importados</span>
                  </div>
                  {result.errors.length > 0 && <p className="mt-1 text-[10px]">{result.errors.length} erro(s)</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

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
