import { ReactNode } from "react";
import { cn } from "../lib/utils";

export interface FilterBarProps {
  children?: ReactNode;
  className?: string;
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full", className)}>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export interface AdvancedFilterPanelProps {
  isOpen: boolean;
  children?: ReactNode;
  className?: string;
}

export function AdvancedFilterPanel({ isOpen, children, className }: AdvancedFilterPanelProps) {
  return (
    <div
      className={cn(
        "grid transition-all duration-300 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0"
      )}
    >
      <div className="overflow-hidden">
        <div
          className={cn(
            "ui-admin-filter-panel grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
