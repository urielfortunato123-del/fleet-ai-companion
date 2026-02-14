interface HealthScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export default function HealthScore({ score, size = "sm" }: HealthScoreProps) {
  const color = score >= 70 ? "text-success" : score >= 40 ? "text-warning" : "text-critical";
  const bgColor = score >= 70 ? "bg-success" : score >= 40 ? "bg-warning" : "bg-critical";
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div className={`relative ${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ${color}`}>
      <svg className="absolute inset-0" viewBox="0 0 36 36">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          className={`stroke-current ${color}`}
          strokeWidth="3"
          strokeDasharray={`${score}, 100`}
          strokeLinecap="round"
        />
      </svg>
      <span>{score}</span>
    </div>
  );
}
