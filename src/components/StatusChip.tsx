interface StatusChipProps {
  status: string;
  size?: "sm" | "md";
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-success/10 text-success" },
  stopped: { label: "Parado", className: "bg-critical/10 text-critical" },
  maintenance: { label: "Manutenção", className: "bg-warning/10 text-warning" },
  reserve: { label: "Reserva", className: "bg-info/10 text-info" },
  open: { label: "Aberto", className: "bg-warning/10 text-warning" },
  resolved: { label: "Resolvido", className: "bg-success/10 text-success" },
  paid: { label: "Pago", className: "bg-success/10 text-success" },
  appealed: { label: "Recorrida", className: "bg-info/10 text-info" },
  critical: { label: "Crítico", className: "bg-critical/10 text-critical" },
  high: { label: "Alto", className: "bg-critical/10 text-critical" },
  medium: { label: "Médio", className: "bg-warning/10 text-warning" },
  low: { label: "Baixo", className: "bg-info/10 text-info" },
};

export default function StatusChip({ status, size = "sm" }: StatusChipProps) {
  const config = statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center rounded-full font-medium
      ${size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"}
      ${config.className}`}
    >
      {config.label}
    </span>
  );
}
