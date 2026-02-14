// Mock data for FrotaSênior AI

const brands = ['Fiat', 'Chevrolet', 'Volkswagen', 'Toyota', 'Hyundai', 'Renault', 'Ford', 'Honda', 'Jeep', 'Nissan'];
const models: Record<string, string[]> = {
  Fiat: ['Strada', 'Argo', 'Mobi', 'Cronos', 'Toro'],
  Chevrolet: ['Onix', 'Tracker', 'S10', 'Montana', 'Spin'],
  Volkswagen: ['Gol', 'Polo', 'T-Cross', 'Saveiro', 'Virtus'],
  Toyota: ['Hilux', 'Corolla', 'Yaris', 'SW4', 'Corolla Cross'],
  Hyundai: ['HB20', 'Creta', 'Tucson', 'HB20S', 'Santa Fe'],
  Renault: ['Kwid', 'Sandero', 'Duster', 'Logan', 'Oroch'],
  Ford: ['Ranger', 'Territory', 'Bronco', 'Maverick', 'Transit'],
  Honda: ['HR-V', 'City', 'Civic', 'WR-V', 'ZR-V'],
  Jeep: ['Renegade', 'Compass', 'Commander', 'Gladiator', 'Wrangler'],
  Nissan: ['Kicks', 'Frontier', 'Versa', 'Sentra', 'X-Trail'],
};
const regions = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'];
const units = [
  { id: '1', name: 'Matriz SP', region: 'Sudeste' },
  { id: '2', name: 'Filial RJ', region: 'Sudeste' },
  { id: '3', name: 'Filial MG', region: 'Sudeste' },
  { id: '4', name: 'Filial BA', region: 'Nordeste' },
  { id: '5', name: 'Filial PR', region: 'Sul' },
  { id: '6', name: 'Filial GO', region: 'Centro-Oeste' },
  { id: '7', name: 'Filial AM', region: 'Norte' },
  { id: '8', name: 'Filial PE', region: 'Nordeste' },
];

const statuses = ['active', 'stopped', 'maintenance', 'reserve'] as const;
type VehicleStatus = typeof statuses[number];

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  unit: string;
  region: string;
  status: VehicleStatus;
  currentKm: number;
  healthScore: number;
  costMonth: number;
  fuelAvg: number; // km/l
  lastMaintenance: string;
  nextMaintenance: string;
  driver?: string;
}

function randomPlate(i: number): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const l1 = letters[Math.floor(i / 676) % 26];
  const l2 = letters[Math.floor(i / 26) % 26];
  const l3 = letters[i % 26];
  const n1 = Math.floor(Math.random() * 10);
  const l4 = letters[Math.floor(Math.random() * 26)];
  const n2 = Math.floor(Math.random() * 10);
  const n3 = Math.floor(Math.random() * 10);
  return `${l1}${l2}${l3}${n1}${l4}${n2}${n3}`;
}

const driverNames = [
  'Carlos Silva', 'Ana Santos', 'João Oliveira', 'Maria Costa', 'Pedro Souza',
  'Fernanda Lima', 'Ricardo Alves', 'Camila Pereira', 'Lucas Ferreira', 'Juliana Rodrigues',
  'Marcos Ribeiro', 'Patricia Gomes', 'Roberto Martins', 'Sandra Barbosa', 'Antonio Cardoso',
];

function generateVehicles(count: number): Vehicle[] {
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < count; i++) {
    const brand = brands[i % brands.length];
    const modelList = models[brand];
    const model = modelList[i % modelList.length];
    const unit = units[i % units.length];
    const status = statuses[Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? 1 : Math.random() < 0.5 ? 2 : 3];
    const healthScore = status === 'active' ? 50 + Math.floor(Math.random() * 50) :
      status === 'maintenance' ? 10 + Math.floor(Math.random() * 30) :
      status === 'stopped' ? 20 + Math.floor(Math.random() * 40) :
      40 + Math.floor(Math.random() * 40);

    vehicles.push({
      id: String(i + 1),
      plate: randomPlate(i),
      model,
      brand,
      year: 2018 + Math.floor(Math.random() * 7),
      unit: unit.name,
      region: unit.region,
      status,
      currentKm: 20000 + Math.floor(Math.random() * 180000),
      healthScore,
      costMonth: 500 + Math.floor(Math.random() * 4500),
      fuelAvg: 6 + Math.round(Math.random() * 10 * 10) / 10,
      lastMaintenance: `2025-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      nextMaintenance: `2026-${String(Math.floor(Math.random() * 6) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      driver: Math.random() > 0.15 ? driverNames[Math.floor(Math.random() * driverNames.length)] : undefined,
    });
  }
  return vehicles;
}

export const vehiclesData = generateVehicles(850);

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  entityType: string;
  entityId: string;
  dueDate: string;
  status: 'open' | 'resolved';
  plate?: string;
}

export const alertsData: Alert[] = [
  { id: '1', severity: 'critical', title: 'Preventiva vencida há 15 dias', description: 'Veículo AAB3C12 com 12.000km excedidos', entityType: 'vehicle', entityId: '1', dueDate: '2026-01-30', status: 'open', plate: 'AAB3C12' },
  { id: '2', severity: 'critical', title: 'CNH vencida', description: 'Motorista Carlos Silva com CNH vencida em 01/02/2026', entityType: 'driver', entityId: '1', dueDate: '2026-02-01', status: 'open' },
  { id: '3', severity: 'high', title: 'Consumo 40% acima da média', description: 'Veículo BBD5E67 com consumo de 4.2 km/l (média: 7.1)', entityType: 'vehicle', entityId: '12', dueDate: '2026-02-14', status: 'open', plate: 'BBD5E67' },
  { id: '4', severity: 'high', title: 'Custo/km elevado', description: 'Veículo CCF7G89 com R$ 2,34/km (limite: R$ 1,20)', entityType: 'vehicle', entityId: '25', dueDate: '2026-02-14', status: 'open', plate: 'CCF7G89' },
  { id: '5', severity: 'high', title: 'CRLV vencendo em 5 dias', description: '3 veículos com CRLV próximo do vencimento', entityType: 'document', entityId: '', dueDate: '2026-02-19', status: 'open' },
  { id: '6', severity: 'medium', title: 'Troca de óleo em 500km', description: 'Veículo DDH9I01 próximo da troca de óleo programada', entityType: 'vehicle', entityId: '30', dueDate: '2026-02-20', status: 'open', plate: 'DDH9I01' },
  { id: '7', severity: 'medium', title: 'Rodízio de pneus pendente', description: '12 veículos com rodízio de pneus atrasado', entityType: 'tire', entityId: '', dueDate: '2026-02-18', status: 'open' },
  { id: '8', severity: 'medium', title: 'Veículo parado há 30+ dias', description: 'Veículo EEJ1K23 sem movimentação desde 15/01', entityType: 'vehicle', entityId: '45', dueDate: '2026-02-14', status: 'open', plate: 'EEJ1K23' },
  { id: '9', severity: 'low', title: 'Seguro vencendo em 30 dias', description: '8 veículos com seguro próximo do vencimento', entityType: 'document', entityId: '', dueDate: '2026-03-14', status: 'open' },
  { id: '10', severity: 'low', title: 'Revisão programada próxima', description: '15 veículos com revisão nos próximos 15 dias', entityType: 'vehicle', entityId: '', dueDate: '2026-02-28', status: 'open' },
];

// Dashboard KPIs
export const dashboardKPIs = {
  totalVehicles: 850,
  activeVehicles: vehiclesData.filter(v => v.status === 'active').length,
  inMaintenance: vehiclesData.filter(v => v.status === 'maintenance').length,
  stopped: vehiclesData.filter(v => v.status === 'stopped').length,
  reserve: vehiclesData.filter(v => v.status === 'reserve').length,
  totalCostMonth: 2847500,
  avgCostPerKm: 0.87,
  avgFuelConsumption: 9.2,
  openAlerts: alertsData.filter(a => a.status === 'open').length,
  criticalAlerts: alertsData.filter(a => a.severity === 'critical').length,
  openWorkOrders: 67,
  overdueWorkOrders: 12,
  avgHealthScore: Math.round(vehiclesData.reduce((s, v) => s + v.healthScore, 0) / vehiclesData.length),
};

// Cost by month chart data
export const costByMonth = [
  { month: 'Set', manutencao: 380000, combustivel: 520000, pneus: 95000, multas: 42000 },
  { month: 'Out', manutencao: 420000, combustivel: 490000, pneus: 88000, multas: 38000 },
  { month: 'Nov', manutencao: 350000, combustivel: 540000, pneus: 102000, multas: 45000 },
  { month: 'Dez', manutencao: 480000, combustivel: 510000, pneus: 78000, multas: 52000 },
  { month: 'Jan', manutencao: 410000, combustivel: 530000, pneus: 92000, multas: 35000 },
  { month: 'Fev', manutencao: 390000, combustivel: 505000, pneus: 85000, multas: 40000 },
];

// Cost by unit
export const costByUnit = [
  { name: 'Matriz SP', cost: 820000, vehicles: 180 },
  { name: 'Filial RJ', cost: 520000, vehicles: 130 },
  { name: 'Filial MG', cost: 410000, vehicles: 110 },
  { name: 'Filial BA', cost: 350000, vehicles: 95 },
  { name: 'Filial PR', cost: 320000, vehicles: 100 },
  { name: 'Filial GO', cost: 280000, vehicles: 90 },
  { name: 'Filial AM', cost: 240000, vehicles: 80 },
  { name: 'Filial PE', cost: 210000, vehicles: 65 },
];

export const vehicleStatusDistribution = [
  { name: 'Ativos', value: dashboardKPIs.activeVehicles, color: 'hsl(142, 71%, 45%)' },
  { name: 'Manutenção', value: dashboardKPIs.inMaintenance, color: 'hsl(38, 92%, 50%)' },
  { name: 'Parados', value: dashboardKPIs.stopped, color: 'hsl(0, 72%, 51%)' },
  { name: 'Reserva', value: dashboardKPIs.reserve, color: 'hsl(217, 91%, 60%)' },
];
