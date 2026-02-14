import { AlertCircle, AlertTriangle, Clock, FileText, Car, Users } from "lucide-react";
import { alertsData } from "@/data/mockData";
import StatusChip from "@/components/StatusChip";

const severityIcon = {
  critical: <AlertCircle className="h-5 w-5 text-critical" />,
  high: <AlertTriangle className="h-5 w-5 text-critical" />,
  medium: <Clock className="h-5 w-5 text-warning" />,
  low: <FileText className="h-5 w-5 text-info" />,
};

const severityBorder = {
  critical: "border-l-critical",
  high: "border-l-critical",
  medium: "border-l-warning",
  low: "border-l-info",
};

export default function DailyOps() {
  const critical = alertsData.filter(a => a.severity === 'critical');
  const high = alertsData.filter(a => a.severity === 'high');
  const medium = alertsData.filter(a => a.severity === 'medium');
  const low = alertsData.filter(a => a.severity === 'low');

  const renderAlertGroup = (title: string, alerts: typeof alertsData, severity: string) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {alerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border border-border border-l-4 ${severityBorder[alert.severity]} bg-card p-4 animate-slide-in hover:shadow-sm transition-shadow cursor-pointer`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {severityIcon[alert.severity]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-card-foreground">{alert.title}</h4>
                  <StatusChip status={alert.severity} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  {alert.plate && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Car className="h-3 w-3" /> {alert.plate}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    Vencimento: {new Date(alert.dueDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operação do Dia</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          {" — "}{alertsData.filter(a => a.status === "open").length} alertas abertos
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-critical/5 p-3 text-center">
          <p className="text-2xl font-bold text-critical">{critical.length}</p>
          <p className="text-xs text-muted-foreground">Críticos</p>
        </div>
        <div className="rounded-lg border border-border bg-critical/5 p-3 text-center">
          <p className="text-2xl font-bold text-critical">{high.length}</p>
          <p className="text-xs text-muted-foreground">Altos</p>
        </div>
        <div className="rounded-lg border border-border bg-warning/5 p-3 text-center">
          <p className="text-2xl font-bold text-warning">{medium.length}</p>
          <p className="text-xs text-muted-foreground">Médios</p>
        </div>
        <div className="rounded-lg border border-border bg-info/5 p-3 text-center">
          <p className="text-2xl font-bold text-info">{low.length}</p>
          <p className="text-xs text-muted-foreground">Baixos</p>
        </div>
      </div>

      {/* Alert groups */}
      <div className="space-y-6">
        {critical.length > 0 && renderAlertGroup("🔴 Críticos — Ação imediata", critical, "critical")}
        {high.length > 0 && renderAlertGroup("🟠 Alta prioridade", high, "high")}
        {medium.length > 0 && renderAlertGroup("🟡 Média prioridade", medium, "medium")}
        {low.length > 0 && renderAlertGroup("🔵 Baixa prioridade", low, "low")}
      </div>
    </div>
  );
}
