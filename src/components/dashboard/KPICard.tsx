import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type KPIVariant = "profit" | "loss" | "warning" | "neutral";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: KPIVariant;
}

const variantStyles: Record<KPIVariant, string> = {
  profit: "kpi-card-profit",
  loss: "kpi-card-loss",
  warning: "kpi-card-warning",
  neutral: "kpi-card-neutral",
};

const iconBgStyles: Record<KPIVariant, string> = {
  profit: "bg-profit/10 text-profit",
  loss: "bg-loss/10 text-loss",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-primary/10 text-primary",
};

export function KPICard({
  title,
  value,
  subtitle,
  change,
  changeLabel,
  icon: Icon,
  variant = "neutral",
}: KPICardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="h-3.5 w-3.5" />;
    if (change < 0) return <TrendingDown className="h-3.5 w-3.5" />;
    return <Minus className="h-3.5 w-3.5" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return "";
    if (change > 0) return "text-profit";
    if (change < 0) return "text-loss";
    return "text-muted-foreground";
  };

  return (
    <div className={cn(variantStyles[variant], "animate-fade-in")}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconBgStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1.5">
          <span className={cn("flex items-center gap-0.5 text-sm font-medium", getTrendColor())}>
            {getTrendIcon()}
            {Math.abs(change)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
