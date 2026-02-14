import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// ============ VEHICLES ============
export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("*").order("plate");
      if (error) throw error;
      return data as Tables<"vehicles">[];
    },
  });
}

export function useInsertVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: TablesInsert<"vehicles">) => {
      const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"vehicles"> & { id: string }) => {
      const { data, error } = await supabase.from("vehicles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

// ============ WORK ORDERS ============
export function useWorkOrders() {
  return useQuery({
    queryKey: ["work_orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_orders").select("*").order("opened_at", { ascending: false });
      if (error) throw error;
      return data as Tables<"work_orders">[];
    },
  });
}

export function useInsertWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (wo: TablesInsert<"work_orders">) => {
      const { data, error } = await supabase.from("work_orders").insert(wo).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });
}

export function useUpdateWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"work_orders"> & { id: string }) => {
      const { data, error } = await supabase.from("work_orders").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });
}

export function useDeleteWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_orders"] }),
  });
}

// ============ FUEL LOGS ============
export function useFuelLogs() {
  return useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fuel_logs").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Tables<"fuel_logs">[];
    },
  });
}

export function useInsertFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: TablesInsert<"fuel_logs">) => {
      const { data, error } = await supabase.from("fuel_logs").insert(log).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuel_logs"] }),
  });
}

export function useDeleteFuelLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fuel_logs"] }),
  });
}

// ============ TIRES ============
export function useTires() {
  return useQuery({
    queryKey: ["tires"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tires").select("*").order("plate");
      if (error) throw error;
      return data as Tables<"tires">[];
    },
  });
}

// ============ FINES ============
export function useFines() {
  return useQuery({
    queryKey: ["fines"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fines").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Tables<"fines">[];
    },
  });
}

// ============ VEHICLE DOCUMENTS ============
export function useVehicleDocuments() {
  return useQuery({
    queryKey: ["vehicle_documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_documents").select("*").order("expiry_date");
      if (error) throw error;
      return data as Tables<"vehicle_documents">[];
    },
  });
}

// ============ INCIDENTS ============
export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("incidents").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Tables<"incidents">[];
    },
  });
}

// ============ BULK UPSERT (for import) ============
export function useBulkUpsert<T extends keyof Tables<"vehicles">>(tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Record<string, any>[]) => {
      const { error } = await supabase.from(tableName as any).upsert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
  });
}

// ============ DASHBOARD STATS ============
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard_stats"],
    queryFn: async () => {
      const [vehiclesRes, workOrdersRes, fuelRes, finesRes, incidentsRes] = await Promise.all([
        supabase.from("vehicles").select("status, health_score, cost_month, fuel_avg, unit"),
        supabase.from("work_orders").select("status, cost_total, opened_at, type"),
        supabase.from("fuel_logs").select("liters, total_cost, cost_per_liter, date"),
        supabase.from("fines").select("status, amount, date"),
        supabase.from("incidents").select("status, damage_estimate, type"),
      ]);

      const vehicles = vehiclesRes.data || [];
      const workOrders = workOrdersRes.data || [];
      const fuelLogs = fuelRes.data || [];
      const fines = finesRes.data || [];
      const incidents = incidentsRes.data || [];

      const totalVehicles = vehicles.length;
      const activeVehicles = vehicles.filter(v => v.status === "active").length;
      const inMaintenance = vehicles.filter(v => v.status === "maintenance").length;
      const stopped = vehicles.filter(v => v.status === "stopped").length;
      const reserve = vehicles.filter(v => v.status === "reserve").length;
      const avgHealthScore = totalVehicles > 0 ? Math.round(vehicles.reduce((s, v) => s + (v.health_score || 0), 0) / totalVehicles) : 0;
      const totalCostMonth = vehicles.reduce((s, v) => s + Number(v.cost_month || 0), 0);
      const avgFuelConsumption = totalVehicles > 0 ? Math.round(vehicles.reduce((s, v) => s + Number(v.fuel_avg || 0), 0) / totalVehicles * 10) / 10 : 0;

      const openWorkOrders = workOrders.filter(w => w.status === "open" || w.status === "in_progress").length;
      const overdueWorkOrders = workOrders.filter(w => w.status === "open").length;

      // Cost by unit
      const unitMap = new Map<string, { cost: number; count: number }>();
      vehicles.forEach(v => {
        const u = unitMap.get(v.unit) || { cost: 0, count: 0 };
        u.cost += Number(v.cost_month || 0);
        u.count++;
        unitMap.set(v.unit, u);
      });
      const costByUnit = Array.from(unitMap.entries())
        .map(([name, { cost, count }]) => ({ name, cost, vehicles: count }))
        .sort((a, b) => b.cost - a.cost);

      // Status distribution
      const vehicleStatusDistribution = [
        { name: "Ativos", value: activeVehicles, color: "hsl(142, 71%, 45%)" },
        { name: "Manutenção", value: inMaintenance, color: "hsl(38, 92%, 50%)" },
        { name: "Parados", value: stopped, color: "hsl(0, 72%, 51%)" },
        { name: "Reserva", value: reserve, color: "hsl(217, 91%, 60%)" },
      ];

      return {
        totalVehicles, activeVehicles, inMaintenance, stopped, reserve,
        avgHealthScore, totalCostMonth, avgFuelConsumption,
        openWorkOrders, overdueWorkOrders,
        costByUnit, vehicleStatusDistribution,
        openAlerts: openWorkOrders,
        criticalAlerts: workOrders.filter(w => w.status === "open").length,
        avgCostPerKm: totalVehicles > 0 ? Math.round(totalCostMonth / totalVehicles / 100 * 100) / 100 : 0,
      };
    },
  });
}
