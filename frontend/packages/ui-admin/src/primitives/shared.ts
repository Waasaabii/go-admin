export const controlSizeClasses = {
  default: "h-[var(--ui-admin-control-height-md)] text-sm",
  large: "h-[var(--ui-admin-control-height-lg)] text-base",
  lg: "h-[var(--ui-admin-control-height-lg)] text-base",
  small: "h-[var(--ui-admin-control-height-sm)] text-xs",
  sm: "h-[var(--ui-admin-control-height-sm)] text-xs",
} as const;

export type ControlSize = keyof typeof controlSizeClasses;
export type ControlStatus = "default" | "error";

export function getControlStateClass(status: ControlStatus = "default") {
  if (status === "error") {
    return "border-destructive/60 focus-visible:ring-destructive/25 focus-visible:border-destructive";
  }

  return "border-input focus-visible:border-primary/60 focus-visible:ring-ring/20";
}

export type SelectOption = {
  label: string;
  value: string | number;
};
