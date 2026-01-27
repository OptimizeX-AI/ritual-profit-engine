import { cn } from "@/lib/utils";
import { Fuel, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface ProjectFuelGaugeProps {
  budgetHours: number;
  consumedHours: number;
  className?: string;
}

export function ProjectFuelGauge({ budgetHours, consumedHours, className }: ProjectFuelGaugeProps) {
  const percent = budgetHours > 0 ? (consumedHours / budgetHours) * 100 : 0;
  const remaining = budgetHours - consumedHours;
  
  const getStatus = () => {
    if (percent > 120) return { status: "critical", color: "text-loss", bg: "bg-loss", label: "Over-servicing Crítico" };
    if (percent > 100) return { status: "warning", color: "text-warning", bg: "bg-warning", label: "Escopo Excedido" };
    if (percent > 80) return { status: "attention", color: "text-pending", bg: "bg-pending", label: "Atenção" };
    return { status: "healthy", color: "text-profit", bg: "bg-profit", label: "Dentro do Escopo" };
  };

  const { status, color, bg, label } = getStatus();

  // SVG gauge arc calculation
  const radius = 80;
  const strokeWidth = 12;
  const circumference = Math.PI * radius; // Half circle
  const displayPercent = Math.min(percent, 150); // Cap at 150% for display
  const offset = circumference - (displayPercent / 150) * circumference;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative">
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 10 100 A 80 80 0 0 1 190 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Filled arc */}
          <path
            d="M 10 100 A 80 80 0 0 1 190 100"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
          {/* Warning threshold line at 80% */}
          <line
            x1="34"
            y1="56"
            x2="40"
            y2="62"
            stroke="currentColor"
            strokeWidth="2"
            className="text-pending"
          />
          {/* Critical threshold line at 100% */}
          <line
            x1="100"
            y1="20"
            x2="100"
            y2="28"
            stroke="currentColor"
            strokeWidth="2"
            className="text-warning"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <div className={cn("text-3xl font-bold", color)}>
            {Math.round(percent)}%
          </div>
          <div className="text-xs text-muted-foreground">consumido</div>
        </div>
      </div>

      {/* Status Badge */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mt-2",
        status === "critical" && "bg-loss/10 text-loss",
        status === "warning" && "bg-warning/10 text-warning",
        status === "attention" && "bg-pending/10 text-pending",
        status === "healthy" && "bg-profit/10 text-profit"
      )}>
        {status === "critical" && <AlertTriangle className="h-4 w-4" />}
        {status === "warning" && <TrendingUp className="h-4 w-4" />}
        {status === "attention" && <Fuel className="h-4 w-4" />}
        {status === "healthy" && <CheckCircle2 className="h-4 w-4" />}
        {label}
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 mt-4 text-center">
        <div>
          <p className="text-2xl font-bold">{consumedHours.toFixed(1)}h</p>
          <p className="text-xs text-muted-foreground">Consumidas</p>
        </div>
        <div>
          <p className={cn("text-2xl font-bold", remaining < 0 ? "text-loss" : "text-profit")}>
            {remaining >= 0 ? `${remaining.toFixed(1)}h` : `${Math.abs(remaining).toFixed(1)}h`}
          </p>
          <p className="text-xs text-muted-foreground">
            {remaining >= 0 ? "Restantes" : "Excedidas"}
          </p>
        </div>
      </div>
    </div>
  );
}
