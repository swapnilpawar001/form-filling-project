import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

type Status = "pending" | "processing" | "completed" | "failed" | "success" | string;

interface JobStatusBadgeProps {
  status: Status;
  className?: string;
}

export function JobStatusBadge({ status, className }: JobStatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const config = {
    pending: {
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
      icon: Clock,
      label: "Pending",
    },
    processing: {
      color: "bg-blue-500/10 text-blue-600 border-blue-200",
      icon: Loader2,
      label: "Processing",
      spin: true,
    },
    completed: {
      color: "bg-green-500/10 text-green-600 border-green-200",
      icon: CheckCircle2,
      label: "Completed",
    },
    success: {
      color: "bg-green-500/10 text-green-600 border-green-200",
      icon: CheckCircle2,
      label: "Success",
    },
    failed: {
      color: "bg-red-500/10 text-red-600 border-red-200",
      icon: XCircle,
      label: "Failed",
    },
  };

  const current = config[normalizedStatus as keyof typeof config] || config.pending;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        current.color,
        className
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", current.spin && "animate-spin")} />
      {current.label}
    </div>
  );
}
