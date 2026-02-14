import { Car, Wrench, Fuel, CircleDot, FileText, AlertTriangle } from "lucide-react";

export interface ImportModule {
  id: string;
  label: string;
  icon: typeof Car;
  table: string;
  columnMap: Record<string, string[]>;
  requiredColumns: string[];
}

export const importModules: ImportModule[] = [
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
  {
    id: "telemetry_readings", label: "Telemetria", icon: Car, table: "telemetry_readings",
    requiredColumns: ["plate", "month_ref"],
    columnMap: {
      plate: ["Placa", "placa", "plate"],
      vehicle_label: ["Veículo", "veiculo", "vehicle_label"],
      month_ref: ["Mês Ref", "mes_ref", "month_ref", "Período"],
      km_start: ["KM Início", "km_inicio", "km_start"],
      km_end: ["KM Fim", "km_fim", "km_end"],
      km_total: ["KM Total", "km_total"],
      days_available: ["Dias Disponível", "dias_disponivel", "days_available"],
      days_in_maintenance: ["Dias Manutenção", "dias_manutencao", "days_in_maintenance"],
      unit: ["Unidade", "unidade", "unit"],
    },
  },
];

export function findColumn(excelHeaders: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const found = excelHeaders.find(h => h.trim().toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  return null;
}

const INT_COLS = new Set(["year", "current_km", "km_at_service", "odometer", "points", "installed_km", "life_expected_km", "health_score", "km_start", "km_end", "km_total", "days_available", "days_in_maintenance"]);
const FLOAT_COLS = new Set(["cost_month", "fuel_avg", "cost_total", "liters", "cost_per_liter", "total_cost", "amount", "damage_estimate", "depth_mm", "cost_unit", "cost", "franchise_km", "discount_amount"]);
const BOOL_COLS = new Set(["has_injury"]);

export function coerceValue(dbCol: string, val: any): any {
  if (val === undefined || val === null || val === "") return undefined;
  if (INT_COLS.has(dbCol)) return parseInt(String(val), 10) || 0;
  if (FLOAT_COLS.has(dbCol)) return parseFloat(String(val).replace(",", ".")) || 0;
  if (BOOL_COLS.has(dbCol)) return val === true || val === "true" || val === "Sim" || val === "sim" || val === 1;
  return String(val).trim();
}

export function detectModule(headers: string[]): ImportModule | null {
  let bestMatch: ImportModule | null = null;
  let bestScore = 0;

  for (const mod of importModules) {
    let score = 0;
    let hasAllRequired = true;

    for (const req of mod.requiredColumns) {
      const possibleNames = mod.columnMap[req];
      if (possibleNames && findColumn(headers, possibleNames)) {
        score += 2; // Required cols worth more
      } else {
        hasAllRequired = false;
      }
    }

    if (!hasAllRequired) continue;

    for (const [dbCol, possibleNames] of Object.entries(mod.columnMap)) {
      if (mod.requiredColumns.includes(dbCol)) continue;
      if (findColumn(headers, possibleNames)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = mod;
    }
  }

  return bestMatch;
}

export function mapRows(rows: Record<string, any>[], mod: ImportModule): { dbRows: Record<string, any>[]; mapping: Record<string, string> } {
  const headers = Object.keys(rows[0] || {});
  const mapping: Record<string, string> = {};

  for (const [dbCol, possibleNames] of Object.entries(mod.columnMap)) {
    const found = findColumn(headers, possibleNames);
    if (found) mapping[dbCol] = found;
  }

  const dbRows = rows.map(row => {
    const dbRow: Record<string, any> = {};
    for (const [dbCol, excelCol] of Object.entries(mapping)) {
      const val = coerceValue(dbCol, row[excelCol]);
      if (val !== undefined) dbRow[dbCol] = val;
    }
    return dbRow;
  }).filter(row => mod.requiredColumns.every(col => row[col]));

  return { dbRows, mapping };
}
