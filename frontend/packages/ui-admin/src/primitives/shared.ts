export const controlSizeClasses = {
  default: "h-10 text-sm",
  large: "h-11 text-base",
  lg: "h-11 text-base",
  small: "h-8 text-xs",
  sm: "h-8 text-xs",
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
