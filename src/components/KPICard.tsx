import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "critical" | "info";
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-card border-l-4 border-l-success border-t-border border-r-border border-b-border",
  warning: "bg-card border-l-4 border-l-warning border-t-border border-r-border border-b-border",
  critical: "bg-card border-l-4 border-l-critical border-t-border border-r-border border-b-border",
  info: "bg-card border-l-4 border-l-info border-t-border border-r-border border-b-border",
};

const iconVariantStyles = {
  default: "bg-secondary text-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-critical/10 text-critical",
  info: "bg-info/10 text-info",
};

export default function KPICard({ title, value, subtitle, icon: Icon, trend, variant = "default" }: KPICardProps) {
  return (
    <div className={`rounded-lg border p-4 ${variantStyles[variant]} animate-slide-in`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium ${trend.value >= 0 ? "text-success" : "text-critical"}`}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconVariantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
