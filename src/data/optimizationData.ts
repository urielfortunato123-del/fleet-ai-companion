import { vehiclesData, costByUnit, costByMonth } from "@/data/mockData";

// Top 20 most expensive vehicles
export const top20Expensive = [...vehiclesData]
  .sort((a, b) => b.costMonth - a.costMonth)
  .slice(0, 20);

// Vehicles with worst fuel efficiency
export const worstFuelEfficiency = [...vehiclesData]
  .filter(v => v.status === "active")
  .sort((a, b) => a.fuelAvg - b.fuelAvg)
  .slice(0, 15);

// Vehicles stopped > simulated days
export const stoppedVehicles = vehiclesData.filter(v => v.status === "stopped");
export const maintenanceVehicles = vehiclesData.filter(v => v.status === "maintenance");

// Cost breakdown
export const totalMonthlyCost = vehiclesData.reduce((s, v) => s + v.costMonth, 0);
export const avgCostPerVehicle = Math.round(totalMonthlyCost / vehiclesData.length);

// Health distribution
export const healthDistribution = {
  excellent: vehiclesData.filter(v => v.healthScore >= 80).length,
  good: vehiclesData.filter(v => v.healthScore >= 60 && v.healthScore < 80).length,
  attention: vehiclesData.filter(v => v.healthScore >= 40 && v.healthScore < 60).length,
  critical: vehiclesData.filter(v => v.healthScore < 40).length,
};

// Savings opportunities
export const savingsOpportunities = [
  {
    id: "1",
    category: "Veículos Parados",
    description: `${stoppedVehicles.length} veículos parados geram custo fixo sem produtividade (seguro, depreciação, IPVA). Realocação ou desmobilização pode gerar economia imediata.`,
    currentCost: stoppedVehicles.reduce((s, v) => s + v.costMonth, 0),
    projectedSaving: Math.round(stoppedVehicles.reduce((s, v) => s + v.costMonth, 0) * 0.6),
    difficulty: "medium" as const,
    timeline: "30 dias",
    actions: [
      "Avaliar necessidade real de cada veículo parado",
      "Desmobilizar veículos sem previsão de uso em 60 dias",
      "Renegociar seguros para veículos em standby",
    ],
  },
  {
    id: "2",
    category: "Consumo Anômalo",
    description: `${worstFuelEfficiency.filter(v => v.fuelAvg < 7).length} veículos com consumo abaixo de 7 km/l (média da frota: 9.2 km/l). Inspeção mecânica e treinamento de motoristas podem reduzir desperdício.`,
    currentCost: Math.round(worstFuelEfficiency.filter(v => v.fuelAvg < 7).reduce((s, v) => s + v.costMonth * 0.4, 0)),
    projectedSaving: Math.round(worstFuelEfficiency.filter(v => v.fuelAvg < 7).reduce((s, v) => s + v.costMonth * 0.15, 0)),
    difficulty: "low" as const,
    timeline: "15 dias",
    actions: [
      "Inspeção mecânica nos 15 piores consumidores",
      "Programa de condução econômica para motoristas",
      "Monitorar consumo semanal por veículo",
    ],
  },
  {
    id: "3",
    category: "Manutenção Preventiva",
    description: "Veículos com score de saúde abaixo de 40 têm 3.2x mais chances de corretiva cara. Antecipar preventivas reduz custos de reparo e paradas não-programadas.",
    currentCost: Math.round(vehiclesData.filter(v => v.healthScore < 40).reduce((s, v) => s + v.costMonth, 0)),
    projectedSaving: Math.round(vehiclesData.filter(v => v.healthScore < 40).reduce((s, v) => s + v.costMonth * 0.25, 0)),
    difficulty: "medium" as const,
    timeline: "60 dias",
    actions: [
      "Priorizar OS preventiva para veículos score < 40",
      "Revisar planos de manutenção por modelo",
      "Implementar check-list diário de inspeção",
    ],
  },
  {
    id: "4",
    category: "Renegociação de Fornecedores",
    description: "Consolidação de fornecedores de peças e serviços. Com 850 veículos, há poder de negociação para contratos melhores.",
    currentCost: Math.round(totalMonthlyCost * 0.35),
    projectedSaving: Math.round(totalMonthlyCost * 0.35 * 0.08),
    difficulty: "high" as const,
    timeline: "90 dias",
    actions: [
      "Mapear todos os fornecedores atuais e volumes",
      "Solicitar cotações para contratos anuais",
      "Negociar descontos por volume em peças e pneus",
    ],
  },
  {
    id: "5",
    category: "Otimização de Frota",
    description: "Análise de utilização mostra veículos subutilizados. Redimensionamento pode eliminar 5-8% da frota sem impacto operacional.",
    currentCost: Math.round(totalMonthlyCost * 0.07),
    projectedSaving: Math.round(totalMonthlyCost * 0.05),
    difficulty: "high" as const,
    timeline: "90 dias",
    actions: [
      "Analisar km rodados por veículo nos últimos 6 meses",
      "Identificar veículos com < 500 km/mês",
      "Propor compartilhamento de veículos entre áreas",
    ],
  },
];

export const totalProjectedSaving = savingsOpportunities.reduce((s, o) => s + o.projectedSaving, 0);
export const savingPercentage = ((totalProjectedSaving / totalMonthlyCost) * 100).toFixed(1);

// Cost trend projection
export const costProjection = [
  { month: "Mar", atual: 2847500, otimizado: 2847500 },
  { month: "Abr", atual: 2890000, otimizado: 2750000 },
  { month: "Mai", atual: 2920000, otimizado: 2680000 },
  { month: "Jun", atual: 2950000, otimizado: 2620000 },
  { month: "Jul", atual: 2900000, otimizado: 2580000 },
  { month: "Ago", atual: 2930000, otimizado: 2550000 },
];

// Unit comparison data
export const unitComparison = costByUnit.map(u => ({
  ...u,
  costPerVehicle: Math.round(u.cost / u.vehicles),
  avgFuel: (7 + Math.random() * 4).toFixed(1),
  stoppedPct: (Math.random() * 15).toFixed(1),
  healthAvg: Math.round(50 + Math.random() * 40),
}));
