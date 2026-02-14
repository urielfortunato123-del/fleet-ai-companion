import { vehiclesData } from "./mockData";

/* ========== MULTAS ========== */
export type FineStatus = "pending" | "paid" | "contested" | "canceled";
export type FineSeverity = "light" | "medium" | "serious" | "very_serious";

export interface Fine {
  id: string;
  plate: string;
  vehicleLabel: string;
  unit: string;
  driverName: string;
  infraction: string;
  severity: FineSeverity;
  status: FineStatus;
  date: string;
  dueDate: string;
  location: string;
  points: number;
  amount: number;
  discountAmount?: number;
  autoNumber: string;
}

const infractions: { desc: string; severity: FineSeverity; points: number; amount: number }[] = [
  { desc: "Excesso de velocidade (até 20%)", severity: "medium", points: 4, amount: 130.16 },
  { desc: "Excesso de velocidade (20% a 50%)", severity: "serious", points: 5, amount: 195.23 },
  { desc: "Excesso de velocidade (acima 50%)", severity: "very_serious", points: 7, amount: 880.41 },
  { desc: "Avançar sinal vermelho", severity: "very_serious", points: 7, amount: 293.47 },
  { desc: "Estacionar em local proibido", severity: "medium", points: 4, amount: 130.16 },
  { desc: "Ultrapassagem proibida", severity: "very_serious", points: 7, amount: 880.41 },
  { desc: "Usar celular ao dirigir", severity: "very_serious", points: 7, amount: 293.47 },
  { desc: "Não usar cinto de segurança", severity: "serious", points: 5, amount: 195.23 },
  { desc: "Dirigir sem CNH", severity: "very_serious", points: 7, amount: 880.41 },
  { desc: "Farol apagado em rodovia", severity: "medium", points: 4, amount: 130.16 },
  { desc: "Conversão proibida", severity: "serious", points: 5, amount: 195.23 },
  { desc: "Transitar na faixa exclusiva", severity: "serious", points: 5, amount: 195.23 },
  { desc: "Parar sobre faixa de pedestres", severity: "medium", points: 4, amount: 130.16 },
  { desc: "Rodízio municipal", severity: "medium", points: 4, amount: 130.16 },
  { desc: "Documentação irregular", severity: "serious", points: 5, amount: 195.23 },
];

const driverNames = [
  "Carlos Silva", "José Santos", "Maria Oliveira", "Ana Costa", "Pedro Lima",
  "Lucas Souza", "Paulo Ferreira", "João Pereira", "Marcos Almeida", "Rafael Ribeiro",
  "Fernando Gomes", "Ricardo Martins", "André Rocha", "Bruno Carvalho", "Diego Araújo",
  "Guilherme Barbosa", "Thiago Nascimento", "Leandro Correia", "Vinícius Moraes", "Eduardo Melo",
];

const cities = [
  "São Paulo - SP", "Rio de Janeiro - RJ", "Belo Horizonte - MG", "Curitiba - PR",
  "Salvador - BA", "Goiânia - GO", "Manaus - AM", "Recife - PE", "Campinas - SP", "Brasília - DF",
];

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().split("T")[0];
}

function generateFines(count: number): Fine[] {
  const fines: Fine[] = [];
  for (let i = 0; i < count; i++) {
    const v = vehiclesData[Math.floor(Math.random() * vehiclesData.length)];
    const inf = infractions[Math.floor(Math.random() * infractions.length)];
    const statusRoll = Math.random();
    const status: FineStatus = statusRoll < 0.35 ? "pending" : statusRoll < 0.7 ? "paid" : statusRoll < 0.9 ? "contested" : "canceled";
    const date = randomDate("2025-06-01", "2026-02-14");
    const due = new Date(date);
    due.setDate(due.getDate() + 30);

    fines.push({
      id: `MULTA-${String(i + 1).padStart(4, "0")}`,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model} ${v.year}`,
      unit: v.unit,
      driverName: driverNames[Math.floor(Math.random() * driverNames.length)],
      infraction: inf.desc,
      severity: inf.severity,
      status,
      date,
      dueDate: due.toISOString().split("T")[0],
      location: cities[Math.floor(Math.random() * cities.length)],
      points: inf.points,
      amount: inf.amount,
      discountAmount: status === "paid" && Math.random() > 0.5 ? Math.round(inf.amount * 0.6 * 100) / 100 : undefined,
      autoNumber: `${String(Math.floor(Math.random() * 900000) + 100000)}`,
    });
  }
  return fines.sort((a, b) => b.date.localeCompare(a.date));
}

export const fines = generateFines(120);

/* ========== DOCUMENTOS ========== */
export type DocType = "crlv" | "ipva" | "seguro" | "licenciamento" | "laudo_vistoria" | "contrato";
export type DocStatus = "valid" | "expiring" | "expired";

export interface VehicleDoc {
  id: string;
  plate: string;
  vehicleLabel: string;
  unit: string;
  docType: DocType;
  description: string;
  issueDate: string;
  expiryDate: string;
  status: DocStatus;
  responsible: string;
  cost?: number;
  notes?: string;
}

const docTypeLabels: Record<DocType, string> = {
  crlv: "CRLV",
  ipva: "IPVA",
  seguro: "Seguro",
  licenciamento: "Licenciamento",
  laudo_vistoria: "Laudo Vistoria",
  contrato: "Contrato",
};
export { docTypeLabels };

function generateDocs(count: number): VehicleDoc[] {
  const docs: VehicleDoc[] = [];
  const types: DocType[] = ["crlv", "ipva", "seguro", "licenciamento", "laudo_vistoria", "contrato"];
  const responsibles = ["Jurídico", "Administrativo", "Gerente de Frota", "Financeiro", "Compliance"];

  for (let i = 0; i < count; i++) {
    const v = vehiclesData[Math.floor(Math.random() * Math.min(300, vehiclesData.length))];
    const docType = types[Math.floor(Math.random() * types.length)];
    const issueDate = randomDate("2025-01-01", "2026-02-01");
    const daysValid = docType === "seguro" ? 365 : docType === "ipva" ? 365 : docType === "crlv" ? 365 : 180 + Math.floor(Math.random() * 365);
    const expiry = new Date(issueDate);
    expiry.setDate(expiry.getDate() + daysValid);
    const expiryDate = expiry.toISOString().split("T")[0];
    const today = new Date("2026-02-14");
    const daysRemaining = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
    const status: DocStatus = daysRemaining < 0 ? "expired" : daysRemaining < 30 ? "expiring" : "valid";

    docs.push({
      id: `DOC-${String(i + 1).padStart(4, "0")}`,
      plate: v.plate,
      vehicleLabel: `${v.brand} ${v.model} ${v.year}`,
      unit: v.unit,
      docType,
      description: docTypeLabels[docType],
      issueDate,
      expiryDate,
      status,
      responsible: responsibles[Math.floor(Math.random() * responsibles.length)],
      cost: ["ipva", "seguro", "licenciamento"].includes(docType) ? 500 + Math.floor(Math.random() * 3000) : undefined,
      notes: Math.random() > 0.7 ? "Verificar renovação" : undefined,
    });
  }
  return docs.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

export const vehicleDocs = generateDocs(200);

/* ========== STATS ========== */
export const finesStats = {
  totalFines: fines.length,
  pendingFines: fines.filter(f => f.status === "pending").length,
  paidFines: fines.filter(f => f.status === "paid").length,
  contestedFines: fines.filter(f => f.status === "contested").length,
  totalAmount: fines.reduce((s, f) => s + f.amount, 0),
  pendingAmount: fines.filter(f => f.status === "pending").reduce((s, f) => s + f.amount, 0),
  totalPoints: fines.reduce((s, f) => s + f.points, 0),
};

export const docsStats = {
  totalDocs: vehicleDocs.length,
  validDocs: vehicleDocs.filter(d => d.status === "valid").length,
  expiringDocs: vehicleDocs.filter(d => d.status === "expiring").length,
  expiredDocs: vehicleDocs.filter(d => d.status === "expired").length,
};
